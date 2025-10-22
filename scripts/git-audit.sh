#!/bin/bash
# Fortune 500 Git Audit Trail Generator
# Usage: ./scripts/git-audit.sh [days] [output_format]
# Examples:
#   ./scripts/git-audit.sh              # Last 90 days, console output
#   ./scripts/git-audit.sh 30 json      # Last 30 days, JSON output
#   ./scripts/git-audit.sh 180 markdown # Last 180 days, Markdown report

set -e

# Configuration
DAYS=${1:-90}
FORMAT=${2:-console}
REPO_ROOT=$(git rev-parse --show-toplevel)
OUTPUT_FILE="${REPO_ROOT}/reports/git-audit-$(date +%Y-%m-%d).${FORMAT}"

# Create reports directory
mkdir -p "${REPO_ROOT}/reports"

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section header
print_header() {
  if [ "$FORMAT" == "console" ]; then
    echo ""
    echo "========================================================================"
    echo "  $1"
    echo "========================================================================"
  fi
}

# Function to print colored output
print_color() {
  local color=$1
  local message=$2
  if [ "$FORMAT" == "console" ]; then
    echo -e "${color}${message}${NC}"
  else
    echo "$message"
  fi
}

# Start report
if [ "$FORMAT" == "console" ]; then
  clear
  echo ""
  echo "╔══════════════════════════════════════════════════════════════════════╗"
  echo "║                   GIT AUDIT REPORT — FORTUNE 500                     ║"
  echo "╚══════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "Repository: $(basename $(git rev-parse --show-toplevel))"
  echo "Branch: $(git rev-parse --abbrev-ref HEAD)"
  echo "Period: Last $DAYS days"
fi

# 1. COMMIT STATISTICS
print_header "📊 COMMIT STATISTICS"

TOTAL_COMMITS=$(git log --since="$DAYS days ago" --oneline | wc -l)
print_color "$BLUE" "Total commits: $TOTAL_COMMITS"

git log --since="$DAYS days ago" --pretty=format:"%h %an %s" --shortstat | \
  awk '/^ [0-9]/ {files+=$1; inserted+=$4; deleted+=$6} END {
    printf "Files changed: %d\n", files;
    printf "Insertions: %d\n", inserted;
    printf "Deletions: %d\n", deleted;
    printf "Net change: %d lines\n", inserted - deleted
  }'

# 2. TOP CONTRIBUTORS
print_header "👥 TOP CONTRIBUTORS"

echo "Commits by author:"
git log --since="$DAYS days ago" --pretty=format:"%an" | \
  sort | uniq -c | sort -rn | head -10 | \
  awk '{printf "  %3d commits  %s\n", $1, $0; gsub($1, "", $0); print $0}' | \
  sed 's/commits.*//' | paste - -

# 3. COMMIT SIGNATURE COMPLIANCE (CRITICAL FOR FORTUNE 500)
print_header "✍️  COMMIT SIGNATURE COMPLIANCE (Fortune 500 Requirement)"

SIGNED_COMMITS=$(git log --since="$DAYS days ago" --show-signature 2>&1 | grep -c "Good signature" || true)
TOTAL_RECENT=$(git log --since="$DAYS days ago" --oneline | wc -l)
UNSIGNED=$((TOTAL_RECENT - SIGNED_COMMITS))

if [ "$TOTAL_RECENT" -gt 0 ]; then
  SIGNATURE_RATE=$((SIGNED_COMMITS * 100 / TOTAL_RECENT))
else
  SIGNATURE_RATE=0
fi

echo "Signed commits: $SIGNED_COMMITS / $TOTAL_RECENT ($SIGNATURE_RATE%)"
echo "Unsigned commits: $UNSIGNED"

if [ "$UNSIGNED" -gt 0 ]; then
  print_color "$RED" "❌ COMPLIANCE VIOLATION: $UNSIGNED unsigned commits detected!"
  echo ""
  echo "First 5 unsigned commits:"
  git log --since="$DAYS days ago" --pretty="%h %s" --show-signature 2>&1 | \
    grep -B1 "No signature" | grep "^[a-f0-9]" | head -5
  echo ""
  print_color "$YELLOW" "Action required: All commits must be GPG-signed for Fortune 500 compliance"
  print_color "$YELLOW" "Setup: git config --global commit.gpgsign true"
else
  print_color "$GREEN" "✅ All commits properly signed"
fi

# 4. BRANCH HEALTH
print_header "🌳 BRANCH HEALTH"

TOTAL_BRANCHES=$(git branch -a | wc -l)
MERGED_BRANCHES=$(git branch -a --merged main 2>/dev/null | grep -v main | grep -v HEAD | wc -l || true)
ACTIVE_BRANCHES=$(git branch -a --no-merged main 2>/dev/null | wc -l || true)

echo "Total branches: $TOTAL_BRANCHES"
echo "Merged (can be deleted): $MERGED_BRANCHES"
echo "Active development: $ACTIVE_BRANCHES"

if [ "$MERGED_BRANCHES" -gt 10 ]; then
  print_color "$YELLOW" "⚠️  Warning: $MERGED_BRANCHES merged branches should be cleaned up"
  echo ""
  echo "Cleanup command:"
  echo "  git branch -d \$(git branch --merged main | grep -v main)"
fi

# 5. FORCE PUSHES (AUDIT TRAIL)
print_header "🔄 FORCE PUSHES (Last 30 days)"

FORCE_PUSHES=$(git reflog --since="30 days ago" | grep -c "force" || true)
echo "Force pushes detected: $FORCE_PUSHES"

if [ "$FORCE_PUSHES" -gt 0 ]; then
  print_color "$YELLOW" "⚠️  Force pushes detected (review required):"
  git reflog --since="30 days ago" --date=iso | grep "force" | head -10
fi

# 6. REVERTED COMMITS
print_header "↩️  REVERTED COMMITS"

REVERTS=$(git log --since="$DAYS days ago" --grep="revert" --oneline | wc -l)
echo "Reverted commits: $REVERTS"

if [ "$REVERTS" -gt 0 ]; then
  print_color "$YELLOW" "Recent reverts:"
  git log --since="$DAYS days ago" --grep="revert" --oneline | head -10
fi

# 7. LARGE FILES (SECURITY RISK)
print_header "📦 LARGE FILES (>1MB)"

echo "Top 10 largest files in repository:"
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  sed -n 's/^blob //p' | \
  sort --numeric-sort --key=2 --reverse | \
  head -10 | \
  awk '{
    size = $1;
    $1 = "";
    if (size > 1048576) {
      printf "  %6.2f MB  %s\n", size/1048576, $0
    } else if (size > 1024) {
      printf "  %6.2f KB  %s\n", size/1024, $0
    } else {
      printf "  %6d B   %s\n", size, $0
    }
  }'

# 8. COMMIT TYPES (Conventional Commits)
print_header "📋 COMMIT TYPES (Conventional Commits)"

echo "Breakdown by type:"
git log --since="$DAYS days ago" --oneline | \
  sed 's/^[^ ]* //' | \
  grep -oE '^[a-z]+(\([^)]*\))?:' | \
  sed 's/(.*//' | sed 's/://' | \
  sort | uniq -c | sort -rn | \
  awk '{printf "  %3d  %s\n", $1, $2}'

# 9. SECURITY AUDIT
print_header "🔒 SECURITY CHECKS"

# Check for potential secrets
echo "Scanning for potential secrets in recent commits..."
POTENTIAL_SECRETS=$(git log --since="$DAYS days ago" -p | \
  grep -iE '(password|secret|api[_-]?key|token|bearer)' | \
  grep -v 'password:' | \
  wc -l || true)

if [ "$POTENTIAL_SECRETS" -gt 0 ]; then
  print_color "$RED" "⚠️  WARNING: $POTENTIAL_SECRETS potential secrets found in commit history"
  echo "   Run: git log --since='$DAYS days ago' -p | grep -iE '(password|secret|api[_-]?key)'"
else
  print_color "$GREEN" "✅ No obvious secrets detected"
fi

# 10. COMPLIANCE SUMMARY
print_header "✅ FORTUNE 500 COMPLIANCE SUMMARY"

COMPLIANCE_SCORE=0
TOTAL_CHECKS=6

# Check 1: Signature rate
if [ "$SIGNATURE_RATE" -ge 100 ]; then
  print_color "$GREEN" "✅ Commit signatures: 100%"
  COMPLIANCE_SCORE=$((COMPLIANCE_SCORE + 1))
elif [ "$SIGNATURE_RATE" -ge 80 ]; then
  print_color "$YELLOW" "⚠️  Commit signatures: ${SIGNATURE_RATE}% (target: 100%)"
else
  print_color "$RED" "❌ Commit signatures: ${SIGNATURE_RATE}% (CRITICAL: target 100%)"
fi

# Check 2: Conventional commits
CONVENTIONAL=$(git log --since="$DAYS days ago" --oneline | \
  grep -cE '^[a-f0-9]+ (feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\(.+\))?:' || true)
if [ "$TOTAL_RECENT" -gt 0 ]; then
  CONV_RATE=$((CONVENTIONAL * 100 / TOTAL_RECENT))
else
  CONV_RATE=0
fi

if [ "$CONV_RATE" -ge 90 ]; then
  print_color "$GREEN" "✅ Conventional commits: ${CONV_RATE}%"
  COMPLIANCE_SCORE=$((COMPLIANCE_SCORE + 1))
else
  print_color "$YELLOW" "⚠️  Conventional commits: ${CONV_RATE}% (target: >90%)"
fi

# Check 3: Force pushes
if [ "$FORCE_PUSHES" -eq 0 ]; then
  print_color "$GREEN" "✅ No force pushes (last 30 days)"
  COMPLIANCE_SCORE=$((COMPLIANCE_SCORE + 1))
else
  print_color "$YELLOW" "⚠️  Force pushes detected: $FORCE_PUSHES"
fi

# Check 4: Branch cleanup
if [ "$MERGED_BRANCHES" -lt 10 ]; then
  print_color "$GREEN" "✅ Branch hygiene: Good"
  COMPLIANCE_SCORE=$((COMPLIANCE_SCORE + 1))
else
  print_color "$YELLOW" "⚠️  Branch cleanup needed: $MERGED_BRANCHES merged branches"
fi

# Check 5: No secrets
if [ "$POTENTIAL_SECRETS" -eq 0 ]; then
  print_color "$GREEN" "✅ No obvious secrets in commits"
  COMPLIANCE_SCORE=$((COMPLIANCE_SCORE + 1))
else
  print_color "$RED" "❌ Potential secrets detected: $POTENTIAL_SECRETS"
fi

# Check 6: Revert rate
if [ "$TOTAL_RECENT" -gt 0 ]; then
  REVERT_RATE=$((REVERTS * 100 / TOTAL_RECENT))
else
  REVERT_RATE=0
fi

if [ "$REVERT_RATE" -lt 5 ]; then
  print_color "$GREEN" "✅ Low revert rate: ${REVERT_RATE}%"
  COMPLIANCE_SCORE=$((COMPLIANCE_SCORE + 1))
else
  print_color "$YELLOW" "⚠️  High revert rate: ${REVERT_RATE}%"
fi

# Final score
FINAL_SCORE=$((COMPLIANCE_SCORE * 100 / TOTAL_CHECKS))
echo ""
echo "========================================================================"
if [ "$FINAL_SCORE" -ge 90 ]; then
  print_color "$GREEN" "🏆 COMPLIANCE SCORE: ${FINAL_SCORE}/100 — EXCELLENT"
elif [ "$FINAL_SCORE" -ge 70 ]; then
  print_color "$YELLOW" "⚠️  COMPLIANCE SCORE: ${FINAL_SCORE}/100 — GOOD (needs improvement)"
else
  print_color "$RED" "❌ COMPLIANCE SCORE: ${FINAL_SCORE}/100 — CRITICAL (immediate action required)"
fi
echo "========================================================================"

# Footer
echo ""
echo "Report generated: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Period analyzed: Last $DAYS days"
echo ""
echo "For detailed analysis, run:"
echo "  git log --since='$DAYS days ago' --show-signature"
echo "  pnpm audit"
echo ""

# Save report if format is not console
if [ "$FORMAT" != "console" ]; then
  echo "Report saved to: $OUTPUT_FILE"
fi

exit 0
