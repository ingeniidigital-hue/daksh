import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "daksh_master_stories.json");

export interface MasterStory {
  id: string;
  title: string;
  category: "core" | "multiplayer" | "economy" | "analytics" | "sdk" | "payments" | "cloud";
  status: "backlog" | "todo" | "in_progress" | "review" | "done";
  priority: "critical" | "high" | "medium";
  user_story: string;
  deliverables: string[];
  security_compliance: string[];
  acceptance_criteria: string[];
  verification_gate: string;
  assigned_agent: string;
  updated_at?: string;
  notes?: string;
}

function getStories(): MasterStory[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading tasks file:", err);
  }
  return [];
}

function saveStories(stories: MasterStory[]): boolean {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(stories, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving tasks file:", err);
    return false;
  }
}

// GET /api/tasks - Query tasks with optional filtering
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  let stories = getStories();

  if (status) {
    stories = stories.filter(s => s.status.toLowerCase() === status.toLowerCase());
  }
  if (category && category !== "all") {
    stories = stories.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const query = search.toLowerCase();
    stories = stories.filter(s => 
      s.id.toLowerCase().includes(query) ||
      s.title.toLowerCase().includes(query) ||
      s.user_story.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({
    total: stories.length,
    tasks: stories,
    timestamp: new Date().toISOString()
  });
}

// PATCH /api/tasks - AI or user updates task status, agent, notes
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, assigned_agent, notes, verification_gate } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    const stories = getStories();
    const index = stories.findIndex(s => s.id.toLowerCase() === id.toLowerCase());

    if (index === -1) {
      return NextResponse.json({ error: `Task with id '${id}' not found` }, { status: 404 });
    }

    if (status) stories[index].status = status;
    if (assigned_agent) stories[index].assigned_agent = assigned_agent;
    if (notes) stories[index].notes = notes;
    if (verification_gate) stories[index].verification_gate = verification_gate;
    stories[index].updated_at = new Date().toISOString();

    saveStories(stories);

    return NextResponse.json({
      success: true,
      message: `Task ${id} updated successfully`,
      task: stories[index]
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update task" }, { status: 500 });
  }
}

// POST /api/tasks - Create a new story/task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.user_story) {
      return NextResponse.json({ error: "title and user_story are required" }, { status: 400 });
    }

    const stories = getStories();
    const nextId = `STORY-${String(stories.length + 1).padStart(2, "0")}`;

    const newStory: MasterStory = {
      id: body.id || nextId,
      title: body.title,
      category: body.category || "core",
      status: body.status || "todo",
      priority: body.priority || "high",
      user_story: body.user_story,
      deliverables: body.deliverables || [],
      security_compliance: body.security_compliance || [],
      acceptance_criteria: body.acceptance_criteria || [],
      verification_gate: body.verification_gate || "Automated test suite passing",
      assigned_agent: body.assigned_agent || "Any AI / Squad",
      updated_at: new Date().toISOString()
    };

    stories.push(newStory);
    saveStories(stories);

    return NextResponse.json({
      success: true,
      task: newStory
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create task" }, { status: 500 });
  }
}
