import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/database";
import CommunityInput from "../models/CommunityInput";
import { OpenAI } from "openai";

// Initialize OpenAI client for LLM categorization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Categories for auto-categorization
const CATEGORIES = [
  "general",
  "safety",
  "transportation",
  "maintenance",
  "traffic",
  "accessibility",
  "parking",
  "public_transit",
  "environment",
  "other"
];

// Helper function to auto-categorize input using LLM
async function autoCategorizeInput(title: string, description: string) {
  try {
    const prompt = `
Categorize the following community input into one of these categories:
${CATEGORIES.join(", ")}

Title: ${title}
Description: ${description}

Only respond with the category name, nothing else.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.3,
    });

    const category = response.choices[0]?.message.content?.trim().toLowerCase() || "general";
    
    // Validate that the category is in our list
    return CATEGORIES.includes(category) ? category : "general";
  } catch (error) {
    console.error("Error in auto-categorization:", error);
    return "general"; // Default fallback category
  }
}

// GET handler to fetch community inputs
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organizationId");
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    
    // Build query object
    const query: any = {};
    
    if (organizationId) {
      query.organizationId = organizationId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    await connectDB();
    
    const communityInputs = await CommunityInput.find(query)
      .sort({ timestamp: -1 })
      .limit(100); // Limit results for performance
    
    return NextResponse.json(communityInputs);
  } catch (error) {
    console.error("Error fetching community inputs:", error);
    return NextResponse.json(
      { error: "Failed to fetch community inputs" },
      { status: 500 }
    );
  }
}

// POST handler to create a new community input
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ["type", "geometry", "title", "description", "category", "organizationId"];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    await connectDB();
    
    // Check for auto-approval settings
    const organizationSettings = {
      autoApprove: false, // In a real app, fetch from organization settings
      autoCategorizeLLM: true, // In a real app, fetch from organization settings
    };
    
    // Auto-categorize with LLM if enabled
    let llmCategory = null;
    if (organizationSettings.autoCategorizeLLM) {
      llmCategory = await autoCategorizeInput(data.title, data.description);
    }
    
    // Create community input
    const communityInput = new CommunityInput({
      ...data,
      userId: session.user.id,
      username: session.user.name || 'Anonymous User',
      status: organizationSettings.autoApprove ? "approved" : "pending",
      llmCategory,
      timestamp: new Date()
    });
    
    await communityInput.save();
    
    return NextResponse.json(communityInput);
  } catch (error) {
    console.error("Error creating community input:", error);
    return NextResponse.json(
      { error: "Failed to create community input" },
      { status: 500 }
    );
  }
}

// PATCH handler to update community input status
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // In a real app, check if user has admin permission
    const isAdmin = true; // Placeholder
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }
    
    const data = await req.json();
    
    if (!data.id || !data.status) {
      return NextResponse.json(
        { error: "Missing required fields: id, status" },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const communityInput = await CommunityInput.findById(data.id);
    
    if (!communityInput) {
      return NextResponse.json(
        { error: "Community input not found" },
        { status: 404 }
      );
    }
    
    // Update fields
    communityInput.status = data.status;
    communityInput.moderatorId = session.user.id;
    communityInput.moderationDate = new Date();
    communityInput.moderationNotes = data.notes || "";
    
    await communityInput.save();
    
    return NextResponse.json(communityInput);
  } catch (error) {
    console.error("Error updating community input:", error);
    return NextResponse.json(
      { error: "Failed to update community input" },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a community input
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // In a real app, check if user has admin permission
    const isAdmin = true; // Placeholder
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const result = await CommunityInput.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { error: "Community input not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting community input:", error);
    return NextResponse.json(
      { error: "Failed to delete community input" },
      { status: 500 }
    );
  }
} 