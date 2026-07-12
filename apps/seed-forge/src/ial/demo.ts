// src/ial/demo.ts
import { compileAndExecuteIAL } from "./ialCompiler";

function runDemo() {
  console.log("🚀 IAL 编译器演示\n");

  const expressions = [
    "Ψ : Γ K Z : V",
    "Æ Σ : Γ Χ : I",
    "Ψ Σ : Γ K Z : V Z₊",
    "Ω : Π T : A₊",
    "Λ : Z K : D",
  ];

  expressions.forEach((expr, idx) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`示例 ${idx + 1}: ${expr}`);
    console.log("=".repeat(60));

    const result = compileAndExecuteIAL(expr);

    console.log("\n原始表达式:", result.program.raw);
    
    if (result.program.whiteOps.length > 0) {
      console.log("\nWhite 层操作：");
      result.program.whiteOps.forEach(op => {
        console.log(`  ${op.glyph} → ${op.opcode}: ${op.description}`);
      });
    }

    if (result.program.blueOps.length > 0) {
      console.log("\nBlue 层操作：");
      result.program.blueOps.forEach(op => {
        console.log(`  ${op.glyph} → ${op.opcode}: ${op.description}`);
      });
    }

    if (result.program.goldOps.length > 0) {
      console.log("\nGold 层操作：");
      result.program.goldOps.forEach(op => {
        console.log(`  ${op.glyph} → ${op.opcode}: ${op.description}`);
      });
    }

    console.log("\n执行后的上下文：");
    console.log("  意识模式标签:", result.context.whiteModeTags);
    console.log("  结构指令:", result.context.structures);
    console.log("  执行动作:", result.context.actions);
  });

  console.log("\n✅ 演示完成！");
}

runDemo();

