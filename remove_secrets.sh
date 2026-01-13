#!/bin/sh
# Remove API key patterns from markdown files
for file in backend/OPENAI_ENV_FIX.md backend/OPENAI_MIGRATION_COMPLETE.md backend/OPENAI_SETUP.md; do
  if [ -f "$file" ]; then
    sed -i.bak 's/sk-proj-[A-Za-z0-9_-]*/your-openai-api-key-here/g' "$file" 2>/dev/null || sed -i '' 's/sk-proj-[A-Za-z0-9_-]*/your-openai-api-key-here/g' "$file" 2>/dev/null || true
    rm -f "$file.bak" 2>/dev/null || true
  fi
done
