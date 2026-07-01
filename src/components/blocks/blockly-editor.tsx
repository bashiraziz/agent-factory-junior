"use client";

import { useEffect, useRef, useCallback } from "react";
import type { ProjectDSL } from "@/lib/runtime/types";

// Block color map
const BLOCK_COLORS: Record<string, string> = {
  afj_goal: "#FFC53D",
  afj_knowledge: "#3DA5F4",
  afj_rule: "#FF6B6B",
  afj_ask_student: "#9B6DFF",
  afj_explain: "#18B5A0",
  afj_quiz: "#FF924D",
  afj_output: "#46C46A",
  afj_approval_required: "#5B6BE6",
};

interface BlocklyEditorProps {
  initialBlocklyJson?: object | null;
  onDslChange: (dsl: ProjectDSL, name: string) => void;
  onBlocklyChange: (json: object) => void;
  projectName: string;
  onWorkspaceReady?: (addBlock: (type: string) => void) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBlockly = any;

// Compile Blockly workspace to DSL
function compileToDSL(workspace: AnyBlockly, projectName: string, Blockly: AnyBlockly): ProjectDSL {
  const dsl: ProjectDSL = {
    version: "1",
    name: projectName,
    description: "",
    goal: "",
    knowledge: [],
    rules: [],
    steps: [],
    approval_required: [],
  };

  const topBlocks: AnyBlockly[] = workspace.getTopBlocks(true);
  const visited = new Set<string>();

  function walk(block: AnyBlockly) {
    if (!block || visited.has(block.id)) return;
    visited.add(block.id);
    processBlock(block, dsl);
    const next = block.getNextBlock?.();
    if (next) walk(next);
  }

  for (const block of topBlocks) {
    walk(block);
  }

  void Blockly; // suppress unused warning
  return dsl;
}

function processBlock(block: AnyBlockly, dsl: ProjectDSL) {
  const type = block.type as string;
  switch (type) {
    case "afj_goal":
      dsl.goal = block.getFieldValue?.("GOAL") || "";
      break;
    case "afj_knowledge": {
      const val = block.getFieldValue?.("CONTENT") || "";
      if (val) dsl.knowledge.push({ type: "teacher_note", content: val });
      break;
    }
    case "afj_rule": {
      const val = block.getFieldValue?.("RULE") || "";
      if (val) dsl.rules.push(val);
      break;
    }
    case "afj_ask_student": {
      const prompt = block.getFieldValue?.("PROMPT") || "";
      dsl.steps.push({ type: "ask_student", prompt });
      break;
    }
    case "afj_explain": {
      const style = (block.getFieldValue?.("STYLE") || "simple") as
        | "simple"
        | "example"
        | "step_by_step";
      dsl.steps.push({ type: "explain", style });
      break;
    }
    case "afj_quiz": {
      const count = parseInt(block.getFieldValue?.("COUNT") || "3", 10);
      dsl.steps.push({ type: "quiz", question_count: count });
      break;
    }
    case "afj_output":
      dsl.steps.push({ type: "output" });
      break;
    case "afj_approval_required": {
      const action = block.getFieldValue?.("ACTION") || "share";
      dsl.approval_required.push({ action });
      break;
    }
  }
}

function registerBlocks(Blockly: AnyBlockly) {
  if (Blockly.Blocks["afj_goal"]) return; // already registered

  function makeBlock(type: string, label: string, fields: Array<{ factory: () => AnyBlockly; name: string }>) {
    Blockly.Blocks[type] = {
      init(this: AnyBlockly) {
        const dummy = this.appendDummyInput();
        dummy.appendField(label);
        for (const field of fields) {
          const row = this.appendDummyInput();
          row.appendField(field.factory(), field.name);
        }
        this.setColour(BLOCK_COLORS[type] || "#888");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip(label);
      },
    };
  }

  makeBlock("afj_goal", "🎯  GOAL", [
    { factory: () => new Blockly.FieldTextInput("What will your AI Worker help with?"), name: "GOAL" },
  ]);

  makeBlock("afj_knowledge", "📚  KNOWLEDGE", [
    { factory: () => new Blockly.FieldTextInput("Enter a fact or note…"), name: "CONTENT" },
  ]);

  makeBlock("afj_rule", "🛡  SAFETY RULE", [
    { factory: () => new Blockly.FieldTextInput("e.g. Only answer science questions"), name: "RULE" },
  ]);

  makeBlock("afj_ask_student", "❓  ASK STUDENT", [
    { factory: () => new Blockly.FieldTextInput("What do you already know about…?"), name: "PROMPT" },
  ]);

  // Explain — with dropdown
  Blockly.Blocks["afj_explain"] = {
    init(this: AnyBlockly) {
      this.appendDummyInput()
        .appendField("💡  EXPLAIN in")
        .appendField(
          new Blockly.FieldDropdown([
            ["simple words", "simple"],
            ["an example", "example"],
            ["step-by-step", "step_by_step"],
          ]),
          "STYLE"
        );
      this.setColour(BLOCK_COLORS["afj_explain"]);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip("Explain the topic in a chosen style");
    },
  };

  // Quiz — with number field
  Blockly.Blocks["afj_quiz"] = {
    init(this: AnyBlockly) {
      this.appendDummyInput()
        .appendField("🎯  QUIZ —")
        .appendField(new Blockly.FieldNumber(3, 1, 10, 1), "COUNT")
        .appendField("questions");
      this.setColour(BLOCK_COLORS["afj_quiz"]);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip("Give the student a quiz");
    },
  };

  // Output — no fields
  Blockly.Blocks["afj_output"] = {
    init(this: AnyBlockly) {
      this.appendDummyInput().appendField("✅  FINAL OUTPUT");
      this.setColour(BLOCK_COLORS["afj_output"]);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip("Deliver the final message");
    },
  };

  // Approval required — with dropdown
  Blockly.Blocks["afj_approval_required"] = {
    init(this: AnyBlockly) {
      this.appendDummyInput()
        .appendField("👤  APPROVAL before")
        .appendField(
          new Blockly.FieldDropdown([
            ["sharing", "share"],
            ["sending", "send"],
            ["saving", "save"],
            ["publishing", "publish"],
          ]),
          "ACTION"
        );
      this.setColour(BLOCK_COLORS["afj_approval_required"]);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip("Require teacher approval before this action");
    },
  };
}

export default function BlocklyEditor({
  initialBlocklyJson,
  onDslChange,
  onBlocklyChange,
  projectName,
  onWorkspaceReady,
}: BlocklyEditorProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<AnyBlockly>(null);
  const onDslChangeRef = useRef(onDslChange);
  const onBlocklyChangeRef = useRef(onBlocklyChange);
  const projectNameRef = useRef(projectName);

  useEffect(() => { onDslChangeRef.current = onDslChange; }, [onDslChange]);
  useEffect(() => { onBlocklyChangeRef.current = onBlocklyChange; }, [onBlocklyChange]);
  useEffect(() => { projectNameRef.current = projectName; }, [projectName]);

  const handleChange = useCallback((Blockly: AnyBlockly) => {
    if (!workspaceRef.current) return;
    const dsl = compileToDSL(workspaceRef.current, projectNameRef.current, Blockly);
    const json = Blockly.serialization.workspaces.save(workspaceRef.current);
    onDslChangeRef.current(dsl, projectNameRef.current);
    onBlocklyChangeRef.current(json);
  }, []);

  useEffect(() => {
    if (!divRef.current) return;

    let workspace: AnyBlockly = null;
    let Blockly: AnyBlockly = null;

    import("blockly").then((mod) => {
      Blockly = mod.default || mod;

      registerBlocks(Blockly);

      // Build custom theme
      let theme: AnyBlockly;
      try {
        theme = Blockly.Theme.defineTheme("afj", {
          base: "classic",
          componentStyles: {
            workspaceBackgroundColour: "transparent",
            toolboxBackgroundColour: "#FBF6EC",
            toolboxForegroundColour: "#2A2A3C",
            flyoutBackgroundColour: "#F4F0FF",
            flyoutForegroundColour: "#2A2A3C",
            scrollbarColour: "#F0E7D6",
          },
          fontStyle: {
            family: "Nunito, sans-serif",
            weight: "700",
            size: 12,
          },
        });
      } catch {
        theme = Blockly.Themes?.Classic;
      }

      if (!divRef.current) return;

      workspace = Blockly.inject(divRef.current, {
        theme,
        grid: { spacing: 28, length: 2, colour: "#EFE7D6", snap: true },
        zoom: {
          controls: false,
          wheel: true,
          startScale: 1.0,
          maxScale: 1.5,
          minScale: 0.5,
          scaleSpeed: 1.2,
        },
        trashcan: true,
        move: { scrollbars: true, drag: true, wheel: false },
        renderer: "zelos",
      });

      workspaceRef.current = workspace;

      if (onWorkspaceReady) {
        const addBlock = (type: string) => {
          if (!workspaceRef.current) return;
          // Place below all existing blocks
          let bottom = 60;
          for (const b of workspaceRef.current.getAllBlocks(false)) {
            const xy = b.getRelativeToSurfaceXY();
            const hw = b.getHeightWidth();
            bottom = Math.max(bottom, xy.y + hw.height + 24);
          }
          const block = workspaceRef.current.newBlock(type);
          block.initSvg();
          block.render();
          block.moveBy(60, bottom);
          workspaceRef.current.scrollBlockIntoView?.(block.id);
          handleChange(Blockly);
        };
        onWorkspaceReady(addBlock);
      }

      // Load initial state
      if (initialBlocklyJson && Object.keys(initialBlocklyJson).length > 0) {
        try {
          Blockly.serialization.workspaces.load(initialBlocklyJson, workspace);
        } catch {
          // ignore
        }
      }

      // UI event types to ignore
      const UI_EVENTS = new Set([
        Blockly.Events.VIEWPORT_CHANGE,
        Blockly.Events.SELECTED,
        Blockly.Events.CLICK,
        Blockly.Events.THEME_CHANGE,
        Blockly.Events.TOOLBOX_ITEM_SELECT,
      ]);

      workspace.addChangeListener((event: AnyBlockly) => {
        if (UI_EVENTS.has(event.type)) return;
        if (!event.isUiEvent) {
          handleChange(Blockly);
        }
      });
    });

    return () => {
      if (workspace) {
        workspace.dispose();
        workspaceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={divRef}
      style={{ width: "100%", height: "100%" }}
      aria-label="Block editor workspace"
    />
  );
}
