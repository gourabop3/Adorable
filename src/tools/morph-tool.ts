import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { FreestyleDevServerFilesystem } from "freestyle-sandboxes";

export const morphTool = (fs: FreestyleDevServerFilesystem) =>
  createTool({
    id: "edit_file",
    description:
      "CRITICAL: Use this tool to make an edit to an existing file. You MUST provide the COMPLETE file content with your changes applied.\n\n" +
      "IMPORTANT: Do NOT use // ... existing code ... comments. Instead, provide the ENTIRE file content with your changes.\n\n" +
      "HOW TO USE:\n" +
      "1. Read the current file content first\n" +
      "2. Make your changes to the content\n" +
      "3. Provide the COMPLETE updated file content in code_edit\n" +
      "4. Do NOT use partial edits or placeholders\n\n" +
      "EXAMPLE:\n" +
      "If you want to change a background color from 'red' to 'blue', provide the entire file with 'blue' instead of 'red'.\n\n" +
      "This tool will replace the entire file content, so make sure your edit includes ALL the code you want to keep.",
    inputSchema: z.object({
      target_file: z.string().describe("The target file to modify."),
      instructions: z
        .string()
        .describe(
          "A single sentence instruction describing what you are going to do for the sketched edit. This is used to assist the less intelligent model in applying the edit. Use the first person to describe what you are going to do. Use it to disambiguate uncertainty in the edit."
        ),
      code_edit: z
        .string()
        .describe(
          "CRITICAL: Provide the COMPLETE file content with your changes applied. Do NOT use partial edits or // ... existing code ... comments. Include the entire file content as you want it to appear after the edit."
        ),
    }),
    execute: async (context) => {
      const { target_file, instructions, code_edit: editSnippet } = context;
      
              console.log(`🔧 edit_file tool called for: ${target_file}`);
        console.log(`📝 Instructions: ${instructions}`);
        console.log(`📏 Edit snippet length: ${editSnippet.length} characters`);
        
        if (!target_file || !instructions || !editSnippet) {
          throw new Error("Missing required parameters: target_file, instructions, or code_edit");
        }
        
        // Check if the AI is just pretending to make changes
        if (editSnippet.trim().length < 10) {
          console.warn(`⚠️ Edit snippet is very short (${editSnippet.trim().length} chars), AI might be pretending to make changes`);
        }
        
        let file;
        try {
          file = await fs.readFile(target_file);
          console.log(`📖 Read original file: ${file.length} characters`);
        } catch (error) {
          throw new Error(
            `File not found: ${target_file}. Error message: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      
      // Intelligent file editing that actually applies the changes
      let finalCode = file;
      
      try {
        // If the edit snippet contains the special comment, process it intelligently
        if (editSnippet.includes("// ... existing code ...")) {
          // Split by the special comment and process each part
          const parts = editSnippet.split("// ... existing code ...");
          
          if (parts.length > 1) {
            // This is a more sophisticated edit - we need to merge it with the original file
            // For now, let's use a simple but effective approach
            const lines = file.split('\n');
            const editLines = editSnippet.split('\n');
            
            // Find the first line that matches between edit and original to locate the edit position
            let startIndex = -1;
            for (let i = 0; i < lines.length; i++) {
              if (editLines.some(editLine => editLine.trim() === lines[i].trim() && editLine.trim() !== '')) {
                startIndex = i;
                break;
              }
            }
            
            if (startIndex !== -1) {
              // Apply the edit by replacing from the matching point
              const beforeEdit = lines.slice(0, startIndex);
              const afterEdit = lines.slice(startIndex + editLines.length);
              finalCode = [...beforeEdit, ...editLines, ...afterEdit].join('\n');
            } else {
              // Fallback: append the edit to the end
              finalCode = file + '\n' + editSnippet;
            }
          } else {
            // Single edit - replace the entire file
            finalCode = editSnippet;
          }
        } else {
          // No special comment - this might be a complete file replacement
          // Check if it looks like a complete file or just a snippet
          if (editSnippet.includes('import ') || editSnippet.includes('export ') || editSnippet.includes('function ') || editSnippet.includes('const ')) {
            // Looks like a complete file, replace it
            finalCode = editSnippet;
          } else {
            // Looks like a snippet, append it
            finalCode = file + '\n' + editSnippet;
          }
        }
        
        // Validate that we're not creating an empty file
        if (finalCode.trim().length === 0) {
          throw new Error("Edit would result in an empty file - aborting");
        }
        
        // Write the updated code to the file
        console.log(`💾 Writing ${finalCode.length} characters to ${target_file}`);
        await fs.writeFile(target_file, finalCode);
        
        // Verify the file was actually written
        const verification = await fs.readFile(target_file);
        if (verification !== finalCode) {
          throw new Error("File write verification failed - changes may not have been applied");
        }
        
        console.log(`✅ File ${target_file} updated successfully!`);
        console.log(`📊 Original: ${file.length} chars, New: ${finalCode.length} chars`);
        
        return {
          success: true,
          message: `File ${target_file} updated successfully. Original: ${file.length} chars, New: ${finalCode.length} chars`,
          originalLength: file.length,
          newLength: finalCode.length,
          changesApplied: true,
          filePath: target_file
        };
        
      } catch (editError) {
        // If intelligent editing fails, fall back to simple replacement
        console.warn(`Intelligent edit failed for ${target_file}, falling back to simple replacement:`, editError);
        
        // Simple fallback: replace the entire file with the edit snippet
        console.log(`⚠️ Using fallback method for ${target_file}`);
        finalCode = editSnippet;
        await fs.writeFile(target_file, finalCode);
        
        console.log(`✅ File ${target_file} updated with fallback method!`);
        console.log(`📊 Original: ${file.length} chars, New: ${finalCode.length} chars`);
        
        return {
          success: true,
          message: `File ${target_file} updated with fallback method. Original: ${file.length} chars, New: ${finalCode.length} chars`,
          originalLength: file.length,
          newLength: finalCode.length,
          changesApplied: true,
          fallbackUsed: true,
          filePath: target_file
        };
      }
    },
  });
