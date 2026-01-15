# Test AI Connection Script for Windows PowerShell
# Run this to verify Ollama and backend are working

Write-Host "🔍 Testing AI Connection..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Ollama Service
Write-Host "1. Testing Ollama Service (http://127.0.0.1:11434/api/tags):" -ForegroundColor Yellow
try {
    $ollamaResponse = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Ollama is running!" -ForegroundColor Green
    Write-Host "   Models: $($ollamaResponse.models.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Ollama is not running: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Fix: Start Ollama with 'ollama serve' or check Windows Services" -ForegroundColor Yellow
}
Write-Host ""

# Test 2: Backend Health (No Auth)
Write-Host "2. Testing Backend Health (http://localhost:8000/health):" -ForegroundColor Yellow
try {
    $backendHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Backend is running!" -ForegroundColor Green
    Write-Host "   Status: $($backendHealth.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Backend is not running: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Fix: Start backend with 'cd backend && npm run dev'" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: AI Health Endpoint (No Auth)
Write-Host "3. Testing AI Health Endpoint (http://localhost:8000/api/ai/health):" -ForegroundColor Yellow
try {
    $aiHealth = Invoke-RestMethod -Uri "http://localhost:8000/api/ai/health" -Method Get -ErrorAction Stop
    if ($aiHealth.healthy) {
        Write-Host "   ✅ AI Health check passed!" -ForegroundColor Green
        Write-Host "   Ollama: Healthy" -ForegroundColor Gray
        Write-Host "   Models: $($aiHealth.models -join ', ')" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  AI Health check returned unhealthy" -ForegroundColor Yellow
        Write-Host "   Error: $($aiHealth.error)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ AI Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Gray
    Write-Host "   Fix: Check if AI routes are registered in backend" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "✅ Testing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. If Ollama failed: Start Ollama service" -ForegroundColor White
Write-Host "2. If Backend failed: Run 'cd backend && npm run dev'" -ForegroundColor White
Write-Host "3. If AI Health failed: Check backend logs for errors" -ForegroundColor White
Write-Host "4. Check browser console (F12) for frontend errors" -ForegroundColor White
