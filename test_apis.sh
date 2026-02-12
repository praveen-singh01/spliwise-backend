#!/bin/bash

# Comprehensive API Testing Script
# Tests all endpoints with proper JWT authentication

BASE_URL="http://localhost:5007"
echo "🧪 Starting Comprehensive API Testing..."
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

# 1. Test Login and get token
echo "📝 Testing Authentication APIs"
echo "----------------------------"

echo "1. POST /api/auth/login"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"testuser@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('token', ''))" 2>/dev/null)
USER_ID=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('user', {}).get('_id', ''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    print_result 0 "Login successful, token received"
    echo "   Token: ${TOKEN:0:50}..."
    echo "   User ID: $USER_ID"
else
    print_result 1 "Login failed"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# 2. Test GET /auth/me
echo "2. GET /api/auth/me"
ME_RESPONSE=$(curl -s $BASE_URL/api/auth/me -H "Authorization: Bearer $TOKEN")
ME_SUCCESS=$(echo $ME_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

if [ "$ME_SUCCESS" = "True" ]; then
    print_result 0 "Get profile successful"
else
    print_result 1 "Get profile failed"
fi
echo ""

# 3. Test GET /auth/users
echo "3. GET /api/auth/users"
USERS_RESPONSE=$(curl -s $BASE_URL/api/auth/users -H "Authorization: Bearer $TOKEN")
USERS_COUNT=$(echo $USERS_RESPONSE | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null)

if [ "$USERS_COUNT" -gt 0 ]; then
    print_result 0 "Get users successful ($USERS_COUNT users)"
else
    print_result 1 "Get users failed"
fi
echo ""

# 4. Test Expense APIs
echo "📊 Testing Expense APIs"
echo "----------------------------"

echo "4. POST /api/expenses (Create Expense)"
CREATE_EXPENSE=$(curl -s -X POST $BASE_URL/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"description\":\"API Test Expense\",\"amount\":1000,\"paidBy\":\"$USER_ID\",\"participants\":[\"$USER_ID\"],\"splitType\":\"equal\",\"category\":\"Testing\"}")

EXPENSE_ID=$(echo $CREATE_EXPENSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('_id', ''))" 2>/dev/null)

if [ -n "$EXPENSE_ID" ]; then
    print_result 0 "Create expense successful"
    echo "   Expense ID: $EXPENSE_ID"
else
    print_result 1 "Create expense failed"
    echo "   Response: $CREATE_EXPENSE"
fi
echo ""

# 5. Test GET /expenses
echo "5. GET /api/expenses"
GET_EXPENSES=$(curl -s $BASE_URL/api/expenses -H "Authorization: Bearer $TOKEN")
EXPENSE_COUNT=$(echo $GET_EXPENSES | python3 -c "import sys, json; print(json.load(sys.stdin).get('count', 0))" 2>/dev/null)

if [ "$EXPENSE_COUNT" -gt 0 ]; then
    print_result 0 "Get expenses successful ($EXPENSE_COUNT expenses)"
else
    print_result 1 "Get expenses failed"
fi
echo ""

# 6. Test GET /expenses/:id
echo "6. GET /api/expenses/$EXPENSE_ID"
GET_EXPENSE=$(curl -s $BASE_URL/api/expenses/$EXPENSE_ID -H "Authorization: Bearer $TOKEN")
GET_EXPENSE_SUCCESS=$(echo $GET_EXPENSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

if [ "$GET_EXPENSE_SUCCESS" = "True" ]; then
    print_result 0 "Get expense by ID successful"
else
    print_result 1 "Get expense by ID failed"
fi
echo ""

# 7. Test PUT /expenses/:id
echo "7. PUT /api/expenses/$EXPENSE_ID (Update Expense)"
UPDATE_EXPENSE=$(curl -s -X PUT $BASE_URL/api/expenses/$EXPENSE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"description":"Updated API Test Expense"}')

UPDATE_SUCCESS=$(echo $UPDATE_EXPENSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

if [ "$UPDATE_SUCCESS" = "True" ]; then
    print_result 0 "Update expense successful"
else
    print_result 1 "Update expense failed"
fi
echo ""

# 8. Test Balance APIs
echo "💰 Testing Balance APIs"
echo "----------------------------"

echo "8. GET /api/balances"
GET_BALANCES=$(curl -s $BASE_URL/api/balances -H "Authorization: Bearer $TOKEN")
BALANCE_SUCCESS=$(echo $GET_BALANCES | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

if [ "$BALANCE_SUCCESS" = "True" ]; then
    print_result 0 "Get balances successful"
else
    print_result 1 "Get balances failed"
fi
echo ""

# 9. Test Subscription APIs
echo "💳 Testing Subscription APIs"
echo "----------------------------"

echo "9. GET /api/subscriptions/plans"
GET_PLANS=$(curl -s $BASE_URL/api/subscriptions/plans)
PLANS_COUNT=$(echo $GET_PLANS | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null)

if [ "$PLANS_COUNT" -eq 3 ]; then
    print_result 0 "Get subscription plans successful (3 plans)"
else
    print_result 1 "Get subscription plans failed"
fi
echo ""

echo "10. GET /api/subscriptions/status"
GET_STATUS=$(curl -s $BASE_URL/api/subscriptions/status -H "Authorization: Bearer $TOKEN")
CURRENT_PLAN=$(echo $GET_STATUS | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('plan', ''))" 2>/dev/null)

if [ -n "$CURRENT_PLAN" ]; then
    print_result 0 "Get subscription status successful (Plan: $CURRENT_PLAN)"
else
    print_result 1 "Get subscription status failed"
fi
echo ""

# 10. Test Groups APIs
echo "👥 Testing Groups APIs"
echo "----------------------------"

echo "11. GET /api/groups"
GET_GROUPS=$(curl -s $BASE_URL/api/groups -H "Authorization: Bearer $TOKEN")
GROUPS_SUCCESS=$(echo $GET_GROUPS | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

if [ "$GROUPS_SUCCESS" = "True" ]; then
    print_result 0 "Get groups successful"
else
    print_result 1 "Get groups failed"
fi
echo ""

echo "12. POST /api/groups (should fail - free user)"
CREATE_GROUP=$(curl -s -X POST $BASE_URL/api/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Test Group\",\"members\":[\"$USER_ID\"]}")

HTTP_402=$(echo $CREATE_GROUP | python3 -c "import sys, json; r=json.load(sys.stdin); print(r.get('message') == 'Payment Required')" 2>/dev/null)

if [ "$HTTP_402" = "True" ]; then
    print_result 0 "Feature-gating working (402 Payment Required)"
else
    print_result 1 "Feature-gating not working"
    echo "   Response: $CREATE_GROUP"
fi
echo ""

# 11. Test DELETE /expenses/:id
echo "13. DELETE /api/expenses/$EXPENSE_ID (Cleanup)"
DELETE_EXPENSE=$(curl -s -X DELETE $BASE_URL/api/expenses/$EXPENSE_ID -H "Authorization: Bearer $TOKEN")
DELETE_SUCCESS=$(echo $DELETE_EXPENSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

if [ "$DELETE_SUCCESS" = "True" ]; then
    print_result 0 "Delete expense successful"
else
    print_result 1 "Delete expense failed"
fi
echo ""

# Summary
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
