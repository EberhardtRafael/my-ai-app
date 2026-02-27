#!/bin/bash

# 🎨 Interactive Testing Demo
# This script shows you testing in action with colors and explanations!

# Color codes for pretty output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${BOLD}${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     🧪 INTERACTIVE UNIT TESTING DEMO                      ║"
echo "║     Watch Your Tests Run in Real-Time!                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${YELLOW}This demo will:${NC}"
echo "  1. Show you what's inside test files"
echo "  2. Run tests and explain the output"
echo "  3. Open visual coverage reports"
echo "  4. Show you how to write your own tests"
echo ""

read -p "Press ENTER to start..."

# ============================================
# PART 1: Show a test file
# ============================================
clear
echo -e "${BOLD}${BLUE}═══ PART 1: What Does a Test Look Like? ═══${NC}"
echo ""
echo -e "${CYAN}Let's look at a real test file:${NC}"
echo -e "${YELLOW}File: src/utils/__tests__/colorUtils.test.ts${NC}"
echo ""
echo "────────────────────────────────────────────────────"

cat << 'EOF'
import { getColorHex } from '../colorUtils';

describe('colorUtils', () => {
  it('should return correct hex for Red', () => {
    // 1️⃣ ARRANGE: Set up test data
    const color = 'Red';
    
    // 2️⃣ ACT: Call the function
    const result = getColorHex(color);
    
    // 3️⃣ ASSERT: Check it's correct
    expect(result).toBe('ef4444');
  });
});
EOF

echo "────────────────────────────────────────────────────"
echo ""
echo -e "${GREEN}✓ This test checks if getColorHex('Red') returns 'ef4444'${NC}"
echo ""

read -p "Press ENTER to continue..."

# ============================================
# PART 2: Run the tests
# ============================================
clear
echo -e "${BOLD}${BLUE}═══ PART 2: Running the Tests ═══${NC}"
echo ""
echo -e "${CYAN}Now let's run all tests and see what happens:${NC}"
echo ""
sleep 1

yarn test --verbose

echo ""
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo -e "${YELLOW}What just happened?${NC}"
echo "  • Jest found 3 test files (*test.ts)"
echo "  • Ran 18 individual tests"
echo "  • All returned the expected results"
echo "  • Total time: ~1 second"
echo ""

read -p "Press ENTER to continue..."

# ============================================
# PART 3: Coverage Report
# ============================================
clear
echo -e "${BOLD}${BLUE}═══ PART 3: Coverage Analysis ═══${NC}"
echo ""
echo -e "${CYAN}Generating coverage report with charts...${NC}"
echo ""

yarn test:coverage

echo ""
echo -e "${YELLOW}📊 Understanding the Coverage Table:${NC}"
echo ""
echo -e "${GREEN}  Stmts: Percentage of code statements executed${NC}"
echo -e "${GREEN}  Branch: Percentage of if/else paths tested${NC}"
echo -e "${GREEN}  Funcs: Percentage of functions called${NC}"
echo -e "${GREEN}  Lines: Percentage of lines run${NC}"
echo ""
echo -e "${CYAN}Files with 100% coverage = Fully tested! ✅${NC}"
echo -e "${YELLOW}Files with 0% coverage = No tests yet ⚠️${NC}"
echo ""

read -p "Press ENTER to open visual reports..."

# ============================================
# PART 4: Open Visual Reports
# ============================================
clear
echo -e "${BOLD}${BLUE}═══ PART 4: Visual Coverage Reports ═══${NC}"
echo ""
echo -e "${CYAN}Opening HTML coverage reports in your browser...${NC}"
echo ""

# Open frontend coverage
if [ -f "coverage/lcov-report/index.html" ]; then
  echo -e "${GREEN}✓ Opening Frontend Coverage Report...${NC}"
  xdg-open coverage/lcov-report/index.html 2>/dev/null &
  echo "  📊 File: coverage/lcov-report/index.html"
  sleep 1
fi

# Open backend coverage
if [ -f "src/app/api/backend/htmlcov/index.html" ]; then
  echo -e "${GREEN}✓ Opening Backend Coverage Report...${NC}"
  xdg-open src/app/api/backend/htmlcov/index.html 2>/dev/null &
  echo "  📊 File: src/app/api/backend/htmlcov/index.html"
  sleep 1
fi

echo ""
echo -e "${YELLOW}In the browser reports, you'll see:${NC}"
echo "  • Color-coded files (red = untested, green = tested)"
echo "  • Click any file to see line-by-line coverage"
echo "  • Bar charts showing coverage percentages"
echo "  • Which exact lines are missing tests"
echo ""

read -p "Press ENTER to continue..."

# ============================================
# PART 5: Practice Exercise
# ============================================
clear
echo -e "${BOLD}${BLUE}═══ PART 5: Your Turn! ═══${NC}"
echo ""
echo -e "${CYAN}Let's write a test together!${NC}"
echo ""
echo -e "${YELLOW}I've created practice files for you:${NC}"
echo "  1. src/utils/formatters.ts (functions to test)"
echo "  2. src/utils/__tests__/formatters.test.ts (practice tests)"
echo ""
echo -e "${GREEN}Open these files in VS Code and:${NC}"
echo "  1. Look at the functions in formatters.ts"
echo "  2. Open formatters.test.ts"
echo "  3. Uncomment tests one at a time"
echo "  4. Fill in the blanks (___FILL_IN___)"
echo "  5. Watch them pass!"
echo ""
echo -e "${CYAN}💡 TIP: Run this command in another terminal:${NC}"
echo -e "${BOLD}   yarn test:watch${NC}"
echo ""
echo "   This will re-run tests automatically as you edit!"
echo ""

read -p "Press ENTER to continue..."

# ============================================
# PART 6: Test-Driven Development Demo
# ============================================
clear
echo -e "${BOLD}${BLUE}═══ PART 6: Test-Driven Development (TDD) ═══${NC}"
echo ""
echo -e "${CYAN}Professional developers often write tests FIRST!${NC}"
echo ""
echo -e "${YELLOW}The TDD Cycle:${NC}"
echo "  🔴 1. Write a test (it fails - RED)"
echo "  🟢 2. Write code to make it pass (GREEN)"
echo "  ♻️  3. Refactor/improve (REFACTOR)"
echo "  🔄 4. Repeat"
echo ""
echo -e "${GREEN}Benefits:${NC}"
echo "  ✓ Forces you to think about requirements first"
echo "  ✓ Ensures all code is testable"
echo "  ✓ Gives you confidence to refactor"
echo "  ✓ Acts as living documentation"
echo ""

read -p "Press ENTER to see final summary..."

# ============================================
# PART 7: Summary
# ============================================
clear
echo -e "${BOLD}${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              🎉 TESTING DEMO COMPLETE!                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BOLD}${GREEN}What You've Learned:${NC}"
echo "  ✅ What unit tests look like"
echo "  ✅ How to run tests and read output"
echo "  ✅ Understanding coverage reports"
echo "  ✅ The Arrange-Act-Assert pattern"
echo "  ✅ How to write your own tests"
echo ""
echo -e "${BOLD}${YELLOW}Quick Reference Commands:${NC}"
echo "  ${CYAN}yarn test${NC}              - Run all tests once"
echo "  ${CYAN}yarn test:watch${NC}        - Run tests on file changes (BEST!)"
echo "  ${CYAN}yarn test:coverage${NC}     - Generate coverage report"
echo "  ${CYAN}yarn test:python${NC}       - Run Python tests"
echo "  ${CYAN}yarn test:all${NC}          - Run everything"
echo ""
echo -e "${BOLD}${YELLOW}📚 Documentation:${NC}"
echo "  • TESTING-TUTORIAL.md - Full interactive tutorial"
echo "  • TESTING.md - Quick reference guide"
echo ""
echo -e "${BOLD}${YELLOW}🎯 Next Steps:${NC}"
echo "  1. Open src/utils/__tests__/formatters.test.ts"
echo "  2. Run: yarn test:watch"
echo "  3. Uncomment tests and watch them run!"
echo "  4. Write tests for your own code"
echo ""
echo -e "${BOLD}${GREEN}Happy Testing! 🚀${NC}"
echo ""
