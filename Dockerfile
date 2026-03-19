FROM php:8.2-cli

# Dependencias del sistema + Node.js
RUN apt-get update && apt-get install -y \
    git unzip zip libpng-dev libonig-dev \
    libxml2-dev libzip-dev curl gnupg

# Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Extensiones PHP incluyendo gd
RUN docker-php-ext-install \
    zip pdo pdo_mysql mbstring exif pcntl bcmath gd

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

# Dependencias PHP
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Assets Vite/Inertia
RUN npm install && npm run build

# Permisos
RUN chmod -R 777 storage bootstrap/cache

# Cachear Laravel
RUN php artisan config:cache || true
RUN php artisan route:cache || true
RUN php artisan view:cache || true

EXPOSE 8000

# Migrar y arrancar
CMD php artisan migrate --force && php -S 0.0.0.0:$PORT -t public