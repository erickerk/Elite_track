#!/bin/bash

# Script para executar TestSprite CLI no Linux/Mac/Git Bash
# Uso: ./run-testsprite.sh "Descrição do teste"

export API_KEY="sk-user-tYeUg4wBMJKToQ-JeX4RTll1q-8b0d2m6Yac_wzNkoepeeNcHUuGW1Hafz6AkSXd8YhRAe0ntCb8-J1RziWI2Vq7P04odL8aVUqzaOD2AuLAc8WN0e-Ws7sz_NLgJK_rU4U"

echo "========================================"
echo "TestSprite CLI Runner - Elite Track"
echo "========================================"
echo ""

if [ -z "$1" ]; then
    echo "Executando teste padrão..."
    node testsprite-runner.js
else
    echo "Executando teste: $1"
    node testsprite-runner.js "$1"
fi
