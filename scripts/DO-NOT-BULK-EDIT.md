RULES:
1. No global sed across app/ or lib/
2. No Prisma outside getPrisma()
3. No duplicate export injection
4. No multi-file structural edits
5. One file change → one test → one commit
