"use client";

import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import { CodeBlock, CodeBlockCode } from "./ui/code-block";
import {
  FileText,
  FolderOpen,
  Edit,
  CheckCircle,
  XCircle,
  Loader2,
  Terminal,
  Code,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";

export function EnhancedToolMessage({
  toolInvocation,
}: {
  toolInvocation: UIMessage["parts"][number];
  className?: string;
}) {
  if (toolInvocation.type === "tool-list_directory") {
    return (
      <EnhancedToolBlock
        name="Listing Directory"
        icon={<FolderOpen className="h-4 w-4" />}
        argsText={toolInvocation.input?.path?.split("/").slice(2).join("/")}
        toolInvocation={toolInvocation}
        color="blue"
      />
    );
  }

  if (toolInvocation.type === "tool-read_file") {
    return <EnhancedReadFileTool toolInvocation={toolInvocation} />;
  }

  if (toolInvocation.type === "tool-edit_file") {
    return <EnhancedEditFileTool toolInvocation={toolInvocation} />;
  }

  if (toolInvocation.type === "tool-write_file") {
    return <EnhancedWriteFileTool toolInvocation={toolInvocation} />;
  }

  if (toolInvocation.type === "tool-exec") {
    return (
      <EnhancedToolBlock
        name="Executing Command"
        icon={<Terminal className="h-4 w-4" />}
        toolInvocation={toolInvocation}
        argsText={toolInvocation.input?.command}
        color="purple"
      />
    );
  }

  if (toolInvocation.type === "tool-create_directory") {
    return (
      <EnhancedToolBlock
        name="Creating Directory"
        icon={<FolderOpen className="h-4 w-4" />}
        toolInvocation={toolInvocation}
        argsText={toolInvocation.input?.path?.split("/").slice(2).join("/")}
        color="orange"
      />
    );
  }

  if (toolInvocation.type === "tool-update_todo_list") {
    return (
      <EnhancedToolBlock
        name="Updating Todo List"
        icon={<CheckCircle className="h-4 w-4" />}
        toolInvocation={toolInvocation}
        color="indigo"
      >
        <div className="grid gap-2 mt-3">
          {toolInvocation.input?.items?.map?.(
            (
              item: { description: string; completed: boolean },
              index: number
            ) => (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-2 bg-white/50 rounded-lg border"
              >
                <div className="relative flex-shrink-0">
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center",
                      item.completed
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                  >
                    {item.completed && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "flex-1 text-sm",
                    item.completed && "line-through text-gray-500"
                  )}
                >
                  {item.description}
                </span>
              </div>
            )
          )}
        </div>
      </EnhancedToolBlock>
    );
  }

  // Fallback for other tools
  return (
    <EnhancedToolBlock
      toolInvocation={toolInvocation}
      name={toolInvocation.type.replaceAll("_", " ").replace("tool-", "")}
      icon={<Code className="h-4 w-4" />}
      color="gray"
    />
  );
}

function EnhancedEditFileTool({
  toolInvocation,
}: {
  toolInvocation: UIMessage["parts"][number] & {
    type: "tool-edit_file";
  };
}) {
  const [expandedEdits, setExpandedEdits] = useState<Set<number>>(new Set());

  const toggleEdit = (index: number) => {
    const newExpanded = new Set(expandedEdits);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEdits(newExpanded);
  };

  return (
    <EnhancedToolBlock
      name="Editing File"
      icon={<Edit className="h-4 w-4" />}
      argsText={toolInvocation.input?.path?.split("/").slice(2).join("/")}
      toolInvocation={toolInvocation}
      color="yellow"
    >
      <div className="grid gap-2 mt-3">
        {toolInvocation.input?.edits?.map?.(
          (edit: { newText: string; oldText: string }, index: number) =>
            (edit.oldText || edit.newText) && (
              <div key={index} className="space-y-2">
                {edit.oldText && (
                  <div className="relative">
                    <div className="absolute -top-2 left-3 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-t">
                      Removed
                    </div>
                    <CodeBlock className="border-red-200 bg-red-50">
                      <CodeBlockCode
                        code={
                          expandedEdits.has(index)
                            ? edit.oldText
                            : edit.oldText?.split("\n").slice(0, 4).join("\n")
                        }
                        language={"tsx"}
                        className="text-red-800"
                      />
                      {edit.oldText?.split("\n").length > 4 && (
                        <div
                          className="text-red-600 px-4 text-xs font-mono py-1 cursor-pointer hover:bg-red-100 flex items-center justify-between"
                          onClick={() => toggleEdit(index)}
                        >
                          <span>
                            {expandedEdits.has(index)
                              ? "Show less"
                              : `+${edit.oldText?.split("\n").length - 4} more lines`}
                          </span>
                          {expandedEdits.has(index) ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      )}
                    </CodeBlock>
                  </div>
                )}
                {edit.newText && (
                  <div className="relative">
                    <div className="absolute -top-2 left-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-t">
                      Added
                    </div>
                    <CodeBlock className="border-green-200 bg-green-50">
                      <CodeBlockCode
                        code={
                          expandedEdits.has(index)
                            ? edit.newText?.trimEnd()
                            : edit.newText
                                ?.trimEnd()
                                ?.split("\n")
                                .slice(0, 4)
                                .join("\n")
                        }
                        language={"tsx"}
                        className="text-green-800"
                      />
                      {edit.newText?.split("\n").length > 4 && (
                        <div
                          className="text-green-600 px-4 text-xs font-mono py-1 cursor-pointer hover:bg-green-100 flex items-center justify-between"
                          onClick={() => toggleEdit(index)}
                        >
                          <span>
                            {expandedEdits.has(index)
                              ? "Show less"
                              : `+${edit.newText?.split("\n").length - 4} more lines`}
                          </span>
                          {expandedEdits.has(index) ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      )}
                    </CodeBlock>
                  </div>
                )}
              </div>
            )
        )}
      </div>
    </EnhancedToolBlock>
  );
}

function EnhancedWriteFileTool({
  toolInvocation,
}: {
  toolInvocation: UIMessage["parts"][number] & {
    type: "tool-write_file";
  };
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <EnhancedToolBlock
      name="Creating File"
      icon={<Plus className="h-4 w-4" />}
      argsText={toolInvocation.input?.path?.split("/").slice(2).join("/")}
      toolInvocation={toolInvocation}
      color="emerald"
    >
      {toolInvocation.input?.content && (
        <div className="mt-3 relative">
          <div className="absolute -top-2 left-3 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-t">
            New File
          </div>
          <CodeBlock className="border-emerald-200 bg-emerald-50">
            <CodeBlockCode
              code={
                isExpanded
                  ? toolInvocation.input?.content
                  : toolInvocation.input?.content
                      ?.split("\n")
                      .slice(0, 6)
                      .join("\n") ?? ""
              }
              language={"tsx"}
              className="text-emerald-800"
            />
            {toolInvocation.input?.content?.split("\n").length > 6 && (
              <div
                className="text-emerald-600 px-4 text-xs font-mono py-2 cursor-pointer hover:bg-emerald-100 flex items-center justify-between"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <span>
                  {isExpanded
                    ? "Show less"
                    : `+${
                        toolInvocation.input?.content?.split("\n").length - 6
                      } more lines`}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </div>
            )}
          </CodeBlock>
        </div>
      )}
    </EnhancedToolBlock>
  );
}

function EnhancedReadFileTool({
  toolInvocation,
}: {
  toolInvocation: UIMessage["parts"][number] & {
    type: "tool-read_file";
  };
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <EnhancedToolBlock
      name="Reading File"
      icon={<FileText className="h-4 w-4" />}
      argsText={toolInvocation.input?.path?.split("/").slice(2).join("/")}
      toolInvocation={toolInvocation}
      color="green"
    >
      {toolInvocation.input?.content && (
        <div className="mt-3 relative">
          <div className="absolute -top-2 left-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-t">
            File Content
          </div>
          <CodeBlock className="border-green-200 bg-green-50">
            <CodeBlockCode
              code={
                isExpanded
                  ? toolInvocation.input?.content
                  : toolInvocation.input?.content
                      ?.split("\n")
                      .slice(0, 6)
                      .join("\n") ?? ""
              }
              language={"tsx"}
              className="text-green-800"
            />
            {toolInvocation.input?.content?.split("\n").length > 6 && (
              <div
                className="text-green-600 px-4 text-xs font-mono py-2 cursor-pointer hover:bg-green-100 flex items-center justify-between"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <span>
                  {isExpanded
                    ? "Show less"
                    : `+${
                        toolInvocation.input?.content?.split("\n").length - 6
                      } more lines`}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </div>
            )}
          </CodeBlock>
        </div>
      )}
    </EnhancedToolBlock>
  );
}

function EnhancedToolBlock(props: {
  toolInvocation?: UIMessage["parts"][number] & {
    type: "tool-";
  };
  name: string;
  icon?: React.ReactNode;
  argsText?: string;
  children?: React.ReactNode;
  color?:
    | "blue"
    | "green"
    | "purple"
    | "orange"
    | "indigo"
    | "yellow"
    | "emerald"
    | "gray";
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const colorClasses = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    gray: "border-gray-200 bg-gray-50 text-gray-700",
  } as const;

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    indigo: "text-indigo-600",
    yellow: "text-yellow-600",
    emerald: "text-emerald-600",
    gray: "text-gray-600",
  } as const;

  const selectedColor = props.color || "gray";

  return (
    <div
      className={cn(
        "mb-4 rounded-lg border-2 transition-all duration-300 overflow-hidden",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        colorClasses[selectedColor]
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          {props.toolInvocation?.state !== "output-available" ? (
            <div className="flex items-center gap-2">
              <Loader2 className={cn("h-4 w-4 animate-spin", iconColorClasses[selectedColor])} />
              <span className="text-sm font-medium">Running...</span>
            </div>
          ) : props.toolInvocation.output?.isError || props.toolInvocation.error ? (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-600">Failed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-600">Completed</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {props.icon && (
            <div className={cn("p-1 rounded", iconColorClasses[selectedColor])}>
              {props.icon}
            </div>
          )}
          <span className="text-sm font-semibold">{props.name}</span>
          {props.argsText && (
            <span className="text-xs opacity-75 font-mono bg-white/50 px-2 py-1 rounded">
              {props.argsText}
            </span>
          )}
        </div>
      </div>

      {props.children && <div className="px-4 pb-3">{props.children}</div>}

      {props.toolInvocation?.state === "output-available" &&
        props.toolInvocation.output?.isError &&
        props.toolInvocation.output?.content?.map(
          (content: { type: "text"; text: string }, i: number) => (
            <div key={i} className="px-4 pb-3">
              <CodeBlock className="border-red-200 bg-red-50">
                <CodeBlockCode
                  className="text-red-800"
                  code={content.text}
                  language="text"
                />
              </CodeBlock>
            </div>
          )
        )}
    </div>
  );
}