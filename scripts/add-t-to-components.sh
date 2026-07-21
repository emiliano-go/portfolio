#!/bin/bash
# For each component that uses t(), add createT import and lang prop support
# Usage: bash scripts/add-t-to-components.sh

for f in src/components/*.astro src/pages/*.astro; do
  # Skip if file doesn't contain t( or {t(
  if ! grep -q '{t(' "$f" 2>/dev/null; then
    # Skip files that have i18n-related script content referencing t but not template t()
    if ! grep -qP '(?<![a-zA-Z])t\((?!"|`)' "$f" 2>/dev/null; then
      continue
    fi
  fi
  
  # Check if createT is already imported
  if grep -q "from '../i18n'" "$f" 2>/dev/null || grep -q 'createT' "$f" 2>/dev/null; then
    echo "  already has i18n import: $f"
    continue
  fi

  echo "  processing: $f"
  
  # Add createT import after the last import statement
  # Use sed with proper handling
  if grep -q '^---$' "$f"; then
    # Count frontmatter dashes
    dash_count=$(grep -c '^---$' "$f")
    if [ "$dash_count" -ge 2 ]; then
      # Find position of second ---
      second_dash=$(grep -n '^---$' "$f" | head -2 | tail -1 | cut -d: -f1)
      # Insert import + lang prop before the second ---
      # First, find the Astro.props or props pattern to add lang
      if grep -q 'Astro\.props' "$f"; then
        sed -i "/^export interface Props/,/^}/ { s/}/  lang: string;\n}/ }" "$f"
        sed -i "${second_dash}s/^---$/\nimport { createT } from '..\/i18n';\n\nconst t = createT(Astro.props.lang);\n---/" "$f"
      elif grep -q '{.*Astro\.props' "$f"; then
        # Handle inline destructuring
        sed -i "/^import/a import { createT } from '..\/i18n';" "$f"
        # Find the destructuring line
        sed -i "s/const {/const { lang, ...rest } = Astro.props; const t = createT(lang);\nconst {/" "$f"
      fi
    fi
  fi
done
