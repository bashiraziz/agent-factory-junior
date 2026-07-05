import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  index,
  unique,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("student"), // student | teacher | parent | admin
  linkCode: text("link_code").unique(), // for parent-child linking (students only)
  coppaConsentedAt: timestamp("coppa_consented_at"), // teacher: school-official COPPA consent timestamp
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const classrooms = pgTable("classrooms", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull(),
  name: text("name").notNull(),
  joinCode: text("join_code").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const classroomMembers = pgTable("classroom_members", {
  id: text("id").primaryKey(),
  classroomId: text("classroom_id").notNull().references(() => classrooms.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  classroomIdIdx: index("classroom_members_classroom_id_idx").on(table.classroomId),
}));

export const parentChildLinks = pgTable("parent_child_links", {
  id: text("id").primaryKey(),
  parentId: text("parent_id").notNull(),
  studentId: text("student_id").notNull(),
  linkCode: text("link_code").notNull(),
  emailOnFlag: boolean("email_on_flag").notNull().default(false),
  emailWeeklyReport: boolean("email_weekly_report").notNull().default(false),
  requireApproval: boolean("require_approval").notNull().default(false),
  consentedAt: timestamp("consented_at"),
  parentEmailVerifiedAt: timestamp("parent_email_verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  parentIdIdx: index("parent_child_links_parent_id_idx").on(table.parentId),
  studentIdIdx: index("parent_child_links_student_id_idx").on(table.studentId),
}));

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => profiles.id),
  classroomId: text("classroom_id"),
  name: text("name").notNull(),
  description: text("description"),
  dslJson: jsonb("dsl_json"),
  blocklyJson: jsonb("blockly_json"),
  status: text("status").notNull().default("draft"), // draft | published
  shareStatus: text("share_status"), // null | "pending" | "approved" | "rejected"
  sharedAt: timestamp("shared_at"),
  parentApprovedAt: timestamp("parent_approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  ownerIdIdx: index("projects_owner_id_idx").on(table.ownerId),
}));

export const agentRuns = pgTable("agent_runs", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull(),
  input: text("input"),
  output: text("output"),
  provider: text("provider").notNull().default("mock"),
  status: text("status").notNull().default("completed"), // completed | flagged | error
  safetyFlags: jsonb("safety_flags"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  projectIdIdx: index("agent_runs_project_id_idx").on(table.projectId),
  studentIdIdx: index("agent_runs_student_id_idx").on(table.studentId),
}));

export const replays = pgTable("replays", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull().unique().references(() => agentRuns.id, { onDelete: "cascade" }),
  projectId: text("project_id").notNull(),
  studentId: text("student_id").notNull(),
  goal: text("goal"),
  knowledgeUsed: jsonb("knowledge_used"),
  rulesApplied: jsonb("rules_applied"),
  stepsFollowed: jsonb("steps_followed"),
  toolsUsed: jsonb("tools_used"),
  approvalRequired: jsonb("approval_required"),
  safetyFlags: jsonb("safety_flags"),
  output: text("output"),
  provider: text("provider").notNull().default("mock"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const classroomSeatCodes = pgTable("classroom_seat_codes", {
  id: text("id").primaryKey(),
  classroomId: text("classroom_id").notNull().references(() => classrooms.id),
  code: text("code").notNull().unique(),
  profileId: text("profile_id"),        // set when student joins
  sessionToken: text("session_token").unique(), // set when student joins
  isActive: boolean("is_active").notNull().default(true),
  joinedAt: timestamp("joined_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  sessionTokenIdx: index("classroom_seat_codes_session_token_idx").on(table.sessionToken),
}));

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull(),
  role: text("role").notNull(), // "user" | "worker"
  content: text("content").notNull(),
  flagged: boolean("flagged").notNull().default(false),
  flagReason: text("flag_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  projectIdIdx: index("chat_messages_project_id_idx").on(table.projectId),
  studentIdIdx: index("chat_messages_student_id_idx").on(table.studentId),
}));

export const childCredentials = pgTable("child_credentials", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").notNull().unique().references(() => profiles.id),
  parentId: text("parent_id").notNull(),
  username: text("username").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
  sessionToken: text("session_token").unique(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  sessionTokenIdx: index("child_credentials_session_token_idx").on(table.sessionToken),
}));

export const usageLimits = pgTable("usage_limits", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  dailyRunLimit: integer("daily_run_limit").notNull().default(5),
  runsUsedToday: integer("runs_used_today").notNull().default(0),
  chatTurnsUsedToday: integer("chat_turns_used_today").notNull().default(0),
  paused: boolean("paused").notNull().default(false),
  periodStart: timestamp("period_start").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const providerKeys = pgTable("provider_keys", {
  id: text("id").primaryKey(),
  ownerProfileId: text("owner_profile_id").notNull().unique().references(() => profiles.id),
  provider: text("provider").notNull().default("gemini"),
  encryptedKey: text("encrypted_key").notNull(),
  keyTail: text("key_tail").notNull(),
  status: text("status").notNull().default("active"), // active | invalid
  lastValidatedAt: timestamp("last_validated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lessonProgress = pgTable("lesson_progress", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => profiles.id),
  chapterId: text("chapter_id").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  studentIdx: index("lesson_progress_student_id_idx").on(t.studentId),
  studentChapterUniq: unique("lesson_progress_student_chapter_uniq").on(t.studentId, t.chapterId),
}));
