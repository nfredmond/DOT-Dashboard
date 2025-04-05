#!/usr/bin/env python
"""
Setup script for Planning Manager Python dependencies
"""
import subprocess
import sys
import os

def check_python_version():
    """Check if Python version is sufficient."""
    required_version = (3, 8)
    current_version = sys.version_info
    
    if current_version < required_version:
        sys.stderr.write(f"Error: Python {required_version[0]}.{required_version[1]} or higher is required\n")
        sys.stderr.write(f"Current version: {current_version.major}.{current_version.minor}\n")
        sys.exit(1)

def install_dependencies():
    """Install dependencies from requirements.txt"""
    print("Installing dependencies from requirements.txt...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Dependencies installed successfully!")
    except subprocess.CalledProcessError as e:
        sys.stderr.write(f"Error installing dependencies: {e}\n")
        sys.exit(1)

def setup_pytorch_cuda():
    """Setup PyTorch with CUDA if applicable"""
    try:
        import torch
        if torch.cuda.is_available():
            print(f"PyTorch is using CUDA: {torch.cuda.get_device_name(0)}")
            print(f"CUDA version: {torch.version.cuda}")
        else:
            print("CUDA is not available. PyTorch will run on CPU.")
    except ImportError:
        print("PyTorch not installed. Skipping CUDA check.")

def main():
    """Main setup function"""
    print("Setting up Planning Manager Python environment...")
    check_python_version()
    install_dependencies()
    setup_pytorch_cuda()
    
    print("\nSetup complete!")
    print("You can now use Python components with your Planning Manager application.")

if __name__ == "__main__":
    main() 