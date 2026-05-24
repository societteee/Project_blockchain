Write-Host "============================================" -ForegroundColor Cyan
Write-Host "ПРОВЕРКА ПРОЕКТА DApp ДЛЯ ГОЛОСОВАНИЯ" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Шаг 1: Проверка Node.js
Write-Host "Шаг 1: Проверка Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion установлен" -ForegroundColor Green
} catch {
    Write-Host "✗ ОШИБКА: Node.js не установлен!" -ForegroundColor Red
    Write-Host "Установи Node.js с https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Нажми Enter для выхода"
    exit 1
}

# Шаг 2: Проверка Yarn
Write-Host ""
Write-Host "Шаг 2: Проверка Yarn..." -ForegroundColor Yellow
try {
    $yarnVersion = yarn --version
    Write-Host "✓ Yarn $yarnVersion установлен" -ForegroundColor Green
} catch {
    Write-Host "Yarn не установлен, устанавливаю..." -ForegroundColor Yellow
    try {
        npm install -g yarn
        $yarnVersion = yarn --version
        Write-Host "✓ Yarn $yarnVersion установлен" -ForegroundColor Green
    } catch {
        Write-Host "✗ ОШИБКА: Не удалось установить Yarn!" -ForegroundColor Red
        Read-Host "Нажми Enter для выхода"
        exit 1
    }
}

# Шаг 3: Переход в папку проекта
Write-Host ""
Write-Host "Шаг 3: Переход в папку проекта..." -ForegroundColor Yellow
$projectPath = Join-Path $PSScriptRoot "dapp-demo-main"
if (Test-Path $projectPath) {
    Set-Location $projectPath
    Write-Host "✓ Перешел в папку проекта" -ForegroundColor Green
} else {
    Write-Host "✗ ОШИБКА: Папка проекта не найдена!" -ForegroundColor Red
    Write-Host "Убедись, что папка dapp-demo-main существует" -ForegroundColor Yellow
    Read-Host "Нажми Enter для выхода"
    exit 1
}

# Шаг 4: Проверка структуры
Write-Host ""
Write-Host "Шаг 4: Проверка структуры проекта..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Ключевые файлы:" -ForegroundColor White

$filesToCheck = @(
    @{Path = "package.json"; Description = "package.json"},
    @{Path = "packages\hardhat\contracts\Ballot.sol"; Description = "Ballot.sol (смарт-контракт)"},
    @{Path = "packages\hardhat\test\Ballot.ts"; Description = "Ballot.ts (тесты)"},
    @{Path = "packages\nextjs\app\voting\page.tsx"; Description = "page.tsx (фронтенд)"},
    @{Path = "README.md"; Description = "README.md"},
    @{Path = "INSTRUCTIONS.md"; Description = "INSTRUCTIONS.md"},
    @{Path = "TESTING.md"; Description = "TESTING.md"},
    @{Path = "CONTRIBUTION.md"; Description = "CONTRIBUTION.md"}
)

foreach ($file in $filesToCheck) {
    if (Test-Path $file.Path) {
        Write-Host "  ✓ $($file.Description)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $($file.Description) не найден!" -ForegroundColor Red
    }
}

# Вывод инструкций
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "ИНСТРУКЦИЯ ДЛЯ ЗАПУСКА:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Установи зависимости (если еще не установлены):" -ForegroundColor White
Write-Host "   yarn install" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Запусти тесты для проверки:" -ForegroundColor White
Write-Host "   yarn test" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Запусти проект в 3-х терминалах:" -ForegroundColor White
Write-Host "   Терминал 1: yarn chain" -ForegroundColor Gray
Write-Host "   Терминал 2: yarn deploy" -ForegroundColor Gray
Write-Host "   Терминал 3: yarn start" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Открой в браузере: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "5. Настрой MetaMask:" -ForegroundColor White
Write-Host "   - Сеть: Hardhat" -ForegroundColor Gray
Write-Host "   - RPC URL: http://localhost:8545" -ForegroundColor Gray
Write-Host "   - Chain ID: 31337" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "ГОТОВО!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Нажми Enter для выхода"