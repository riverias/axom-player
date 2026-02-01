Write-Host "Очистка кода от комментариев и отладочной информации..."

# Функция для очистки TypeScript/JavaScript файлов
function Clean-TSFile {
    param($FilePath)
    
    $content = Get-Content $FilePath -Raw
    if ($content) {
        # Удаляем однострочные комментарии
        $content = $content -replace '//.*$', '' -split "`n" | ForEach-Object { $_.TrimEnd() } | Where-Object { $_ -ne '' } | Join-String -Separator "`n"
        
        # Удаляем многострочные комментарии
        $content = $content -replace '/\*[\s\S]*?\*/', ''
        
        # Удаляем console.log, console.warn, console.error
        $content = $content -replace 'console\.(log|warn|error|info|debug)\([^)]*\);?', ''
        
        # Удаляем пустые строки
        $content = ($content -split "`n" | Where-Object { $_.Trim() -ne '' }) -join "`n"
        
        Set-Content $FilePath $content -NoNewline
        Write-Host "Очищен: $FilePath"
    }
}

# Функция для очистки CSS файлов
function Clean-CSSFile {
    param($FilePath)
    
    $content = Get-Content $FilePath -Raw
    if ($content) {
        # Удаляем CSS комментарии
        $content = $content -replace '/\*[\s\S]*?\*/', ''
        
        # Удаляем пустые строки
        $content = ($content -split "`n" | Where-Object { $_.Trim() -ne '' }) -join "`n"
        
        Set-Content $FilePath $content -NoNewline
        Write-Host "Очищен: $FilePath"
    }
}

# Очищаем все TypeScript и JavaScript файлы
Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" | ForEach-Object {
    Clean-TSFile $_.FullName
}

# Очищаем все CSS файлы
Get-ChildItem -Path "src" -Recurse -Include "*.css" | ForEach-Object {
    Clean-CSSFile $_.FullName
}

Write-Host "Очистка завершена!"
Write-Host "Все комментарии, console.log и отладочная информация удалены."