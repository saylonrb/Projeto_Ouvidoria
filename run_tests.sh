#!/bin/bash
set -e

# Inicia o backend
cd backend
npm install
node src/server.js &
BACKEND_PID=$!
cd ..

# Inicia o frontend
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

# Aguarda ambos os serviços subirem
sleep 10

# Executa testes
npx playwright test tests/audit_full.spec.js tests/e2e.spec.js

# Derruba os processos
kill $BACKEND_PID
kill $FRONTEND_PID
