import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Path to the Python executable and script
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const SCRIPT_DIR = path.join(process.cwd(), 'python_modules');

/**
 * API route for network analysis
 * POST /api/network-analysis
 */
export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json();
    const { source, timeThresholds, networkFile } = requestData;

    if (!source || !timeThresholds || !networkFile) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate source coordinates
    if (!Array.isArray(source) || source.length !== 2) {
      return NextResponse.json(
        { error: 'Source must be [longitude, latitude] array' },
        { status: 400 }
      );
    }

    // Create temporary files for input/output
    const inputFile = path.join(process.cwd(), 'tmp', `input-${Date.now()}.json`);
    const outputFile = path.join(process.cwd(), 'tmp', `output-${Date.now()}.json`);

    // Ensure tmp directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'tmp'))) {
      fs.mkdirSync(path.join(process.cwd(), 'tmp'), { recursive: true });
    }

    // Write input data to file
    fs.writeFileSync(
      inputFile,
      JSON.stringify({
        source: source,
        timeThresholds: timeThresholds,
        networkFile: networkFile,
        outputFile: outputFile
      })
    );

    // Run Python script for analysis
    const result = await runPythonScript('run_analysis.py', [inputFile]);

    // Check if output file exists
    if (!fs.existsSync(outputFile)) {
      return NextResponse.json(
        { error: 'Analysis failed to produce output', log: result },
        { status: 500 }
      );
    }

    // Read and return results
    const resultData = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

    // Clean up temporary files
    try {
      fs.unlinkSync(inputFile);
      fs.unlinkSync(outputFile);
    } catch (e) {
      console.error('Error cleaning up temp files:', e);
    }

    return NextResponse.json(resultData);
  } catch (error) {
    console.error('Error in network analysis API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Run a Python script with given arguments
 */
function runPythonScript(scriptName: string, args: string[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPT_DIR, scriptName);
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      return reject(new Error(`Script not found: ${scriptPath}`));
    }

    const process = spawn(PYTHON_PATH, [scriptPath, ...args]);
    
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Script exited with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * GET handler for testing the API is working
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Network analysis API is running'
  });
} 