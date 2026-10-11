import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("AI Project Management Task Dataset & Schema Validation", () => {
  const tasksFilePath = path.join(__dirname, "..", "data", "daksh_master_stories.json");

  it("should contain exactly 17 master stories with valid schema", () => {
    expect(fs.existsSync(tasksFilePath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(tasksFilePath, "utf-8"));
    
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(17);

    // Verify all 17 story IDs are sequential and present
    const storyIds = data.map((s: any) => s.id);
    for (let i = 1; i <= 17; i++) {
      const expectedId = `STORY-${String(i).padStart(2, "0")}`;
      expect(storyIds).toContain(expectedId);
    }
  });

  it("should validate all required fields for AI execution", () => {
    const data = JSON.parse(fs.readFileSync(tasksFilePath, "utf-8"));
    
    data.forEach((story: any) => {
      expect(story.id).toMatch(/^STORY-\d{2}$/);
      expect(typeof story.title).toBe("string");
      expect(story.title.length).toBeGreaterThan(5);
      
      expect(typeof story.user_story).toBe("string");
      expect(story.user_story).toMatch(/^As (a|an|the) /);
      
      expect(Array.isArray(story.deliverables)).toBe(true);
      expect(story.deliverables.length).toBeGreaterThan(0);
      
      expect(Array.isArray(story.security_compliance)).toBe(true);
      expect(story.security_compliance.length).toBeGreaterThan(0);
      
      expect(Array.isArray(story.technical_tasks)).toBe(true);
      expect(story.technical_tasks.length).toBeGreaterThanOrEqual(3);

      expect(Array.isArray(story.test_cases)).toBe(true);
      expect(story.test_cases.length).toBeGreaterThanOrEqual(3);

      expect(["todo", "in_progress", "done"]).toContain(story.status);
    });
  });

  it("should confirm Story 15 represents Daksh Managed Cloud GaaS", () => {
    const data = JSON.parse(fs.readFileSync(tasksFilePath, "utf-8"));
    const story15 = data.find((s: any) => s.id === "STORY-15");
    
    expect(story15).toBeDefined();
    expect(story15.title).toContain("Managed Cloud");
    expect(story15.category).toBe("cloud");
    expect(story15.deliverables.some((d: string) => d.includes("5 Super-Regions"))).toBe(true);
    expect(story15.deliverables.some((d: string) => d.includes("Agones"))).toBe(true);
  });
});
