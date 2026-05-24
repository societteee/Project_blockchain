@echo off
echo ============================================
echo ПРОВЕРКА ПРОЕКТА DApp ДЛЯ ГОЛОСОВАНИЯ
echo ============================================
echo.

echo Шаг 1: Проверка Node.js...
node --version
if errorlevel 1 (
    echo ОШИБКА: Node.js не установлен!
    echo Установи Node.js с https://nodejs.org
    pause
    exit /b 1
)

echo.
echo Шаг 2: Проверка Yarn...
yarn --version
if errorlevel 1 (
    echo Yarn не установлен, устанавливаю...
    npm install -g yarn
    yarn --version
    if errorlevel 1 (
        echo ОШИБКА: Не удалось установить Yarn!
        pause
        exit /b 1
    )
)

echo.
echo Шаг 3: Переход в папку проекта...
cd /d "%~dp0dapp-demo-main"
if errorlevel 1 (
    echo ОШИБКА: Не удалось перейти в папку проекта!
    echo Убедись, что папка dapp-demo-main существует
    pause
    exit /b 1
)

echo.
echo Шаг 4: Проверка структуры проекта...
echo.
echo Содержимое папки:
dir
echo.
echo Ключевые файлы:
if exist package.json (
    echo ✓ package.json найден
) else (
    echo ✗ ОШИБКА: package.json не найден!
)

if exist packages\hardhat\contracts\Ballot.sol (
    echo ✓ Ballot.sol найден
) else (
    echo ✗ ОШИБКА: Ballot.sol не найден!
)

if exist packages\hardhat\test\Ballot.ts (
    echo ✓ Ballot.ts найден
) else (
    echo ✗ ОШИБКА: Ballot.ts не найден!
)

if exist packages\nextjs\app\voting\page.tsx (
    echo ✓ page.tsx (фронтенд) найден
) else (
    echo ✗ ОШИБКА: page.tsx не найден!
)

echo.
echo ============================================
echo ИНСТРУКЦИЯ ДЛЯ ЗАПУСКА:
echo ============================================
echo.
echo 1. Установи зависимости (если еще не установлены):
echo    yarn install
echo.
echo 2. Запусти тесты для проверки:
echo    yarn test
echo.
echo 3. Запусти проект в 3-х терминалах:
echo    Терминал 1: yarn chain
echo    Терминал 2: yarn deploy
echo    Терминал 3: yarn start
echo.
echo 4. Открой в браузере: http://localhost:3000
echo.
echo 5. Настрой MetaMask:
echo    - Сеть: Hardhat
echo    - RPC URL: http://localhost:8545
echo    - Chain ID: 31337
echo.
echo ============================================
echo ДОКУМЕНТАЦИЯ:
echo ============================================
echo.
echo Полные инструкции: INSTRUCTIONS.md
echo Руководство по тестированию: TESTING.md
echo Описание вклада: CONTRIBUTION.md
echo.
pause