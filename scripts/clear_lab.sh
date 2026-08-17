#!/usr/bin/env bash
# Submits all remaining unsubmitted products in a lab using a fixed
# gemstone rating, to verify the lab-completion + shard-award flow.
# Usage: ./clear_lab.sh <labId>
set -e
LAB="$1"

while true; do
  echo "==> Visiting /expedition/$LAB"
  agent-browser open "http://localhost:3000/expedition/$LAB" >/dev/null 2>&1
  agent-browser wait 1500 >/dev/null 2>&1

  # Find the first enabled "Discover …" button ref.
  SNAPSHOT=$(agent-browser snapshot -i 2>/dev/null)
  REF=$(echo "$SNAPSHOT" | grep -E '^- button "Discover ' | grep -v 'disabled' | head -1 | sed -E 's/.*ref=([^]]*).*/\1/')
  if [ -z "$REF" ]; then
    echo "  No more enabled products. Lab cleared (or all submitted)."
    break
  fi
  PRODUCT_NAME=$(echo "$SNAPSHOT" | grep -E "^- button \"Discover " | grep "ref=$REF" | sed -E 's/.*Discover ([^"]+)".*/\1/')
  echo "  Clicking product: $PRODUCT_NAME (ref=$REF)"
  agent-browser click "@$REF" >/dev/null 2>&1
  agent-browser wait 1500 >/dev/null 2>&1

  # Pick Ruby.
  RUBY_REF=$(agent-browser snapshot -i 2>/dev/null | grep -E '^- button "Ruby \(tier 3\)"' | head -1 | sed -E 's/.*ref=([^]]*).*/\1/')
  echo "  Ruby ref=$RUBY_REF"
  agent-browser click "@$RUBY_REF" >/dev/null 2>&1
  agent-browser wait 300 >/dev/null 2>&1

  # Submit.
  SUBMIT_REF=$(agent-browser snapshot -i 2>/dev/null | grep -E '^- button "Log discovery"' | head -1 | sed -E 's/.*ref=([^]]*).*/\1/')
  echo "  Submit ref=$SUBMIT_REF"
  agent-browser click "@$SUBMIT_REF" >/dev/null 2>&1
  agent-browser wait 2500 >/dev/null 2>&1

  echo "  Now at: $(agent-browser get url 2>/dev/null)"
done

echo "==> Lab $LAB cleared."
