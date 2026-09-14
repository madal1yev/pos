# Claude Project Rules

> Ushbu loyiha uchun Claude Code qoidalari. Yangi qoida paydo bo'lsa shu faylni yangilang.

## Papka tuzilishi

```
claude/
├── skills/   # Yaratilgan yoki qo'shilgan skill'lar
├── agents/   # AI agentlar va multi-agent arxitektura
├── mcps/     # MCP config va settings fayllari
├── tasks/    # task.md (faol) + done.md (arxiv)
└── RULES.md  # Ushbu fayl
```

## Qoidalar
- **skills/** — har bir yangi yaratilgan yoki qo'shilgan skill shu papkaga qo'shiladi (YAML frontmatter bilan: skill, name, version, description).
- **agents/** — barcha agentlar va multi-agent arxitekturasi shu yerda; har biri alohida kichik papkada `README.md` bilan.
- **mcps/** — barcha MCP config va sozlamalar shu yerda.
- **tasks/** — `task.md` da barcha faol vazifalar; vazifa bajarilsa `task.md` dan o'chirilib, sana bilan `done.md` ga ko'chiriladi (hech qachon o'chirilmaydi — arxivlanadi).
- Placeholder matn qoldirilmaydi ("TODO", "Coming Soon").
- Barcha hujjatlar Markdown formatida.
