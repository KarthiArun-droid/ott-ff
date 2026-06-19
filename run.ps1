# Start Auth Service in a new window with correct database environment variables
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location D:\ott\services\auth-service; `$env:DB_URI='postgres://postgres:12345678@localhost:5432/ott_catalog?sslmode=disable'; & 'C:\Program Files\Go\bin\go.exe' run main.go"

# Start Catalog Service in a new window with correct database environment variables
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location D:\ott\services\catalog-service; `$env:DB_URI='postgres://postgres:12345678@localhost:5432/ott_catalog?sslmode=disable'; & 'C:\Program Files\Go\bin\go.exe' run main.go repository.go models.go"

# Start API Gateway in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location D:\ott\api-gateway; & 'C:\Program Files\Go\bin\go.exe' run main.go"
