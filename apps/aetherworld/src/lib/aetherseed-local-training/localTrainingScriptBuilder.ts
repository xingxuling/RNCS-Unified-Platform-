// AetherSeed Local Training · 训练脚本草案构建器
// 生成 train.py / eval.py / requirements.txt / README_local_training.md 的字符串内容。
// 这些脚本由用户在本机手动执行，本系统不会自动运行。
import type { LocalTrainingConfig, LocalTrainingPlan } from "./localTrainingTypes";

export function buildRequirementsTxt(): string {
  return [
    "# AetherSeed Local Training · requirements.txt 草案",
    "# 由用户在本机手动 pip install。",
    "torch>=2.1",
    "numpy>=1.24",
    "pyyaml>=6.0",
    "tqdm>=4.66",
    "sentencepiece>=0.1.99",
    "",
  ].join("\n");
}

export function buildTrainPy(plan: LocalTrainingPlan, cfg: LocalTrainingConfig): string {
  return `"""AetherSeed Local Training · train.py 草案
计划：${plan.name}
目标：${plan.targetModel} / 模式：${plan.trainingMode}
说明：
  - 这是一个最小可运行的 tiny transformer 训练脚本草案。
  - 仅用于本机慢速训练炉验证；不要在生产数据上直接运行。
  - 由 Founder 在本机执行：python train.py --config config.yaml
"""
import argparse
import json
import os
import yaml
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader


class JsonlDataset(Dataset):
    def __init__(self, path: str, max_len: int):
        self.samples = []
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                text = obj.get("output") if isinstance(obj.get("output"), str) else json.dumps(obj.get("output"))
                instr = obj.get("instruction", "")
                self.samples.append((instr or "", text or ""))
        self.max_len = max_len

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        instr, out = self.samples[idx]
        # 占位 tokenizer：按字节截断为整数 id（仅 toy 验证用）
        ids = list(("INSTR:" + instr + "\\nOUT:" + out).encode("utf-8"))[: self.max_len]
        return torch.tensor(ids, dtype=torch.long)


class TinyTransformer(nn.Module):
    def __init__(self, vocab_size, hidden_size, num_layers, num_heads, context_length):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, hidden_size)
        self.pos = nn.Embedding(context_length, hidden_size)
        layer = nn.TransformerEncoderLayer(d_model=hidden_size, nhead=num_heads, batch_first=True)
        self.encoder = nn.TransformerEncoder(layer, num_layers=num_layers)
        self.head = nn.Linear(hidden_size, vocab_size)

    def forward(self, x):
        b, t = x.shape
        pos = torch.arange(0, t, device=x.device).unsqueeze(0).expand(b, t)
        h = self.embed(x) + self.pos(pos)
        h = self.encoder(h)
        return self.head(h)


def collate(batch):
    max_len = max(b.size(0) for b in batch)
    out = torch.zeros(len(batch), max_len, dtype=torch.long)
    for i, b in enumerate(batch):
        out[i, : b.size(0)] = b
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--out", default="checkpoint")
    args = parser.parse_args()

    with open(args.config, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    os.makedirs(args.out, exist_ok=True)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[AetherSeed] device = {device}")

    train_ds = JsonlDataset(cfg["dataset"]["train_file"], cfg["model"]["context_length"])
    train_dl = DataLoader(train_ds, batch_size=cfg["training"]["batch_size"], shuffle=True, collate_fn=collate)

    model = TinyTransformer(
        vocab_size=cfg["model"]["vocab_size"],
        hidden_size=cfg["model"]["hidden_size"],
        num_layers=cfg["model"]["num_layers"],
        num_heads=cfg["model"]["num_heads"],
        context_length=cfg["model"]["context_length"],
    ).to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=float(cfg["training"]["learning_rate"]))
    loss_fn = nn.CrossEntropyLoss()

    step = 0
    for epoch in range(int(cfg["training"]["epochs"])):
        for batch in train_dl:
            batch = batch.to(device)
            logits = model(batch[:, :-1])
            target = batch[:, 1:]
            loss = loss_fn(logits.reshape(-1, logits.size(-1)), target.reshape(-1))
            opt.zero_grad()
            loss.backward()
            opt.step()
            step += 1
            if step % 10 == 0:
                print(f"epoch={epoch} step={step} loss={loss.item():.4f}")
            if step % int(cfg["training"]["save_every_steps"]) == 0:
                ckpt = os.path.join(args.out, f"${plan.targetModel.toLowerCase()}_step_{step}.pt".replace("aetherseed_", "aetherseed_"))
                torch.save({"model": model.state_dict(), "step": step}, ckpt)
                print(f"[AetherSeed] saved {ckpt}")

    final_ckpt = os.path.join(args.out, "${plan.targetModel.toLowerCase()}_final.pt")
    torch.save({"model": model.state_dict(), "step": step}, final_ckpt)
    print(f"[AetherSeed] final checkpoint: {final_ckpt}")


if __name__ == "__main__":
    main()
`;
}

export function buildEvalPy(plan: LocalTrainingPlan): string {
  return `"""AetherSeed Local Training · eval.py 草案
计划：${plan.name}
说明：
  - 读取 eval.jsonl 与训练 checkpoint，估算简单的交叉熵 loss / 命中率。
  - 不进行任何外部上传；评测结果写入 eval_report.json。
"""
import argparse
import json
import os
import torch
import yaml


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--out", default="eval_report.json")
    args = parser.parse_args()

    with open(args.config, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    eval_file = cfg["dataset"].get("eval_file")
    if not eval_file or not os.path.exists(eval_file):
        print("[AetherSeed] no eval file, skip")
        return

    state = torch.load(args.checkpoint, map_location="cpu")
    print(f"[AetherSeed] loaded checkpoint step={state.get('step')}")

    samples = []
    with open(eval_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                samples.append(json.loads(line))
            except Exception:
                continue

    report = {
        "checkpoint": args.checkpoint,
        "eval_samples": len(samples),
        "note": "本草案仅做占位；请在本机替换为真实评测指标（perplexity / 命中 / JSON 合法率等）。",
    }
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"[AetherSeed] wrote {args.out}")


if __name__ == "__main__":
    main()
`;
}

export function buildLocalTrainingReadme(plan: LocalTrainingPlan, cfg: LocalTrainingConfig): string {
  const lines: string[] = [];
  lines.push(`# AetherSeed 本机训练 · ${plan.name}`);
  lines.push("");
  lines.push(`- 计划 ID：\`${plan.id}\``);
  lines.push(`- 目标模型：\`${plan.targetModel}\``);
  lines.push(`- 训练模式：\`${plan.trainingMode}\``);
  lines.push(`- 预计时长：${plan.estimatedDuration}`);
  lines.push(`- 数据集版本：\`${plan.datasetVersionId}\``);
  if (plan.evalDatasetVersionId) lines.push(`- 评测集版本：\`${plan.evalDatasetVersionId}\``);
  lines.push("");
  lines.push("## 安全边界");
  lines.push("- 本系统不会自动执行训练命令，所有命令请由 Founder 手动复制并在本机运行。");
  lines.push("- 训练数据已在 Dataset Builder 阶段排除 BLOCK 样本与敏感残留。");
  lines.push("- 不要将 checkpoint / 训练数据上传到任何外部服务。");
  lines.push("");
  lines.push("## 准备");
  lines.push("```bash");
  lines.push("python -m venv .venv && source .venv/bin/activate   # Windows 请用 .venv\\Scripts\\activate");
  lines.push("pip install -r requirements.txt");
  lines.push("```");
  lines.push("");
  lines.push("## 训练");
  lines.push("```bash");
  lines.push("python train.py --config config.yaml --out checkpoint");
  lines.push("```");
  lines.push("");
  lines.push("## 评测");
  lines.push("```bash");
  lines.push("python eval.py --config config.yaml --checkpoint checkpoint/" + plan.targetModel.toLowerCase() + "_final.pt --out eval_report.json");
  lines.push("```");
  lines.push("");
  lines.push("## 模型规模");
  lines.push(`- 隐藏维度：${cfg.modelConfig.hiddenSize} · 层数：${cfg.modelConfig.numLayers} · 头数：${cfg.modelConfig.numHeads}`);
  lines.push(`- 上下文：${cfg.modelConfig.contextLength} · 参数估计：${cfg.modelConfig.parameterEstimate}`);
  lines.push("");
  lines.push("## 训练完成后");
  lines.push("- 回到 `/system/local-training`，把实验状态从 `READY_TO_RUN` 手动改为 `COMPLETED_MANUAL`。");
  lines.push("- 在 `outputArtifactPath` 字段登记本机 checkpoint 路径（不会上传，只用于追溯）。");
  lines.push("");
  return lines.join("\n");
}
