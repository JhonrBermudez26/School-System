FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    git unzip zip libpng-dev libonig-dev \
    libxml2-dev libzip-dev curl gnupg

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

RUN docker-php-ext-install \
    zip pdo pdo_mysql mbstring exif pcntl bcmath gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-scripts
RUN npm install && npm run build
RUN chmod -R 777 storage bootstrap/cache

EXPOSE 8000

CMD bash -c "php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan storage:link && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"