# TrustGuard AI, сайт: как развернуть его на сервере из репозитория

Репозиторий: `git@github.com:denny7437/24trust.git` (приватный, ветка `main`) · Домен: `24trust.ru` · Сервер: `5.42.118.104` (A-записи `@` и `www` уже указывают на него, проверено 30.10.2026) · Составлено: 2026-10-30

Схема: интернет → nginx на сервере (порты 80 и 443, сертификат Let's Encrypt) → Docker-контейнер с сайтом на `127.0.0.1:3000` → папка `data/` с заявками.

Времени уйдёт около часа, из них 3–6 минут сборка образа. Все команды выполняются на сервере, если не помечено иначе.

## Что проверено, а что нет

- **Проверено на Mac 30.10.2026:** конфиги nginx в контейнере с nginx 1.30 (синтаксис, редиректы, лимит заявок с ответом 429, пароль на сайте, проверка сертификата по http), скрипт очистки заявок на тестовом файле, сборка свежего клона репозитория без флага `ALLOW_PLACEHOLDERS` (`npm ci`, lint, typecheck, `next build`, «Проверка заглушек пройдена»). Образ из копии проекта с закрытыми заглушками собирался и отдавал страницы, логотип и sitemap в Docker на Mac 29.10.2026.
- **Не проверено:** сам сервер. Я на него не попал (SSH с Mac зависал, см. шаг 2), поэтому установка пакетов, файрвол, deploy key и клонирование на сервере, выпуск сертификата и доступ сервера к GitHub и Docker Hub не проверялись. Строки cron и обёртку `docker run` для очистки заявок я тоже не запускал. Если на каком-то шаге вывод отличается от описанного, остановитесь и посмотрите раздел «Если что-то пошло не так» в конце.
- **Адрес сервера** взят из DNS. Если ваш сервер другой, замените `5.42.118.104` во всех командах.

---

## 0. Три вещи, на которых легко споткнуться

**1. Защита от заглушек.** Сборка останавливается, пока на сайте есть `[заглушки]`, пустые реквизиты или адрес `localhost` (`scripts/check-placeholders.mjs`, хук `postbuild`), а значит останавливается и `docker compose up --build`. На 30.10.2026 заглушек нет, и сборка с боевым адресом проходит (проверено на свежем клоне репозитория). Но без `NEXT_PUBLIC_SITE_URL` защита остановит сборку на адресе `localhost`, поэтому он обязательно должен быть в `.env` на сервере (шаг 6). Если позже в код попадут новые заглушки, сборка на сервере остановится, а в её выводе будет список с файлами и строками. Два пути:

- **A. Основной путь: собрать боевой сайт.** Проверка на Mac в папке проекта до `git push`:

```bash
NEXT_PUBLIC_SITE_URL=https://24trust.ru npm run build
```

Если в конце написано «Проверка заглушек пройдена», можно отправлять в репозиторий и выкатывать.

- **B. Черновик под паролем.** Нужен, чтобы посмотреть сайт на домене, пока тексты не готовы: сборка с `ALLOW_PLACEHOLDERS=1` (шаг 7) и пароль на сайт в nginx (шаг 10). Пока пароль стоит, сайт не видят ни посетители, ни поисковики. Настоящие заявки в черновик не принимайте: согласие и политика с заглушками не годятся для сбора ПДн (152-ФЗ). Когда заглушки закрыты, пересоберите без флага и уберите пароль.

**2. SSH с Mac может зависать из-за VPN.** 30.10.2026 при включённом VPN на весь трафик (интерфейс `utun4`, MTU 1407) SSH к серверу `5.42.118.104` зависал: порт 22 открыт и баннер приходит, но обмен ключами не завершается (`Connection ... timed out`), а при уменьшенном размере TCP-сегмента сервер сразу закрывал соединение (`Connection closed by remote host`). Причина не подтверждена: это может быть VPN, а может быть защита на самом сервере от лишних подключений. На время деплоя отключите VPN или добавьте `5.42.118.104` в исключения (split tunneling): серверу в РФ незачем идти через зарубежный выход. Подробности в шаге 2.

**3. Docker Hub может быть недоступен.** С выхода того VPN Docker Hub отвечал `403 RBAC: access denied`. Если такое будет на сервере, сборка упадёт на загрузке `node:22-alpine`. Решение в шаге 4 (зеркало `mirror.gcr.io`).

---

## 1. Что понадобится

- Доступ к серверу по SSH (логин и пароль root из письма или панели Timeweb, либо ваш SSH-ключ).
- Сервер на Ubuntu, 1 vCPU, 2 ГБ RAM, 30 ГБ диска (минимум; при 1 ГБ RAM сборка может не пройти без swap).
- Код в репозитории `denny7437/24trust` (ветка `main`); серверу нужен доступ на чтение (deploy key, шаг 5).
- Почта, которую вы читаете, для уведомлений Let's Encrypt (не `info@24trust.ru`, пока этого ящика нет).

---

## 2. Подключение к серверу

**На Mac:**

```bash
ssh root@5.42.118.104
```

Первый раз ssh спросит про отпечаток ключа сервера: ответьте `yes`. Дальше введите пароль root. Чтобы входить без пароля, положите на сервер свой публичный ключ (пароль спросят один раз). У вас в `~/.ssh` есть, например, `id_rsa.pub`:

```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub root@5.42.118.104
```

**Если ssh зависает или обрывается** (`Connection ... timed out`, `Connection closed by remote host`):

1. Отключите VPN или исключите `5.42.118.104` из туннеля и повторите.
2. Подождите 10–15 минут: после нескольких неудачных подключений подряд `fail2ban` или сам sshd могут временно закрыть ваш адрес.
3. Если и без VPN не пускает, зайдите через веб-консоль сервера в панели хостера и посмотрите: `systemctl status ssh`, `journalctl -u ssh -n 50`, `fail2ban-client status sshd` (если fail2ban установлен), `ufw status`. Заодно проверьте файрвол в самой панели хостера.
4. Если пишет `Permission denied (publickey)`, ваш ключ на сервере не установлен: войдите по паролю или через веб-консоль и добавьте ключ (`ssh-copy-id` выше).

Сборка займёт несколько минут, поэтому после входа запустите `tmux`, чтобы обрыв SSH её не прервал (на сервере: `apt-get install -y tmux && tmux new -s deploy`; вернуться после обрыва: `tmux attach -t deploy`).

---

## 3. Осмотр сервера (ничего не меняет)

На портах 80 и 443 сервер сейчас что-то слушает и отвечает пустым ответом (похоже на заглушку nginx). Прежде чем настраивать, посмотрите, что там есть, и не удаляйте чужие настройки.

**На сервере:**

```bash
. /etc/os-release; echo "$PRETTY_NAME"
nproc; free -h; df -h /
ss -ltnp | grep -E ':(22|80|443|3000) '
docker --version; nginx -v; certbot --version
ls /etc/nginx/sites-enabled/ /etc/nginx/conf.d/
nginx -T 2>/dev/null | grep -E 'server_name|listen|return|proxy_pass' | head -30
```

Если какой-то программы нет, это нормально, дальше установим. Если на сервере уже работают другие сайты, их конфиги не трогайте: мы добавим свой отдельный файл.

---

## 4. Подготовка сервера

**На сервере.** Обновления:

```bash
apt-get update && apt-get -y upgrade
```

Если после обновления написано, что нужна перезагрузка, выполните `reboot` и войдите снова.

Swap 2 ГБ (сборке Next.js нужна память; если `swapon --show` уже что-то показывает, пропустите):

```bash
swapon --show
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

Файрвол. Порт SSH разрешается первым, поэтому соединение не оборвётся. Если SSH у вас не на 22 порту, замените номер:

```bash
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp
ufw --force enable
ufw status
```

Docker, nginx и утилиты из репозитория Ubuntu:

```bash
apt-get install -y docker.io docker-compose-v2 nginx certbot git rsync
systemctl enable --now docker nginx
docker --version && docker compose version
```

Ограничение размера логов контейнера и зеркало реестра. Без первого логи Docker растут без предела; второе нужно, если сервер не может скачать образы с Docker Hub (если скачивает, зеркало ничему не мешает: Docker сам вернётся на Docker Hub):

```bash
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "registry-mirrors": ["https://mirror.gcr.io"]
}
EOF
systemctl restart docker
```

---

## 5. Получение кода на сервере

**На сервере.** Репозиторий приватный, поэтому серверу нужен собственный ключ только для чтения (deploy key). Он привязан к одному репозиторию. Свой личный ключ GitHub на сервер не кладите.

Создайте ключ и покажите его публичную часть:

```bash
ssh-keygen -t ed25519 -N '' -C "deploy@24trust" -f /root/.ssh/github_24trust_deploy
cat /root/.ssh/github_24trust_deploy.pub
```

Скопируйте выведенную строку (`ssh-ed25519 AAAA... deploy@24trust`). В GitHub откройте репозиторий `denny7437/24trust` → Settings → Deploy keys → Add deploy key, вставьте строку, название любое. Галочку «Allow write access» не ставьте: серверу нужно только читать.

Склонируйте репозиторий. При первом подключении ssh спросит про отпечаток GitHub. Он должен быть `SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU` (ED25519; тот же отпечаток в официальном списке в документации GitHub, раздел «GitHub's SSH key fingerprints»). Если совпал, ответьте `yes`:

```bash
GIT_SSH_COMMAND='ssh -i /root/.ssh/github_24trust_deploy -o IdentitiesOnly=yes' git clone git@github.com:denny7437/24trust.git /opt/trustguard-site
git -C /opt/trustguard-site config core.sshCommand 'ssh -i /root/.ssh/github_24trust_deploy -o IdentitiesOnly=yes'
```

Вторая команда запоминает ключ в репозитории, поэтому дальше `git pull` работает без переменной.

Проверка:

```bash
cd /opt/trustguard-site && git log --oneline -3 && ls -A
```

Должны быть `Dockerfile`, `docker-compose.yml`, `package.json`, `package-lock.json`, `.env.example`, `public`, `scripts`, `src` и другие файлы проекта.

Если клонирование не получилось:

- `Permission denied (publickey)`: ключ не добавлен в Deploy keys этого репозитория или добавлен в другой. Проверка: `ssh -i /root/.ssh/github_24trust_deploy -o IdentitiesOnly=yes -T git@github.com` должна ответить `Hi ...! You've successfully authenticated, but GitHub does not provide shell access.`
- `Connection timed out` на порту 22: хостер закрывает исходящий порт 22. Используйте GitHub через порт 443: в обеих командах вместо `git@github.com:denny7437/24trust.git` напишите `ssh://git@ssh.github.com:443/denny7437/24trust.git`.
- GitHub с сервера не открывается совсем: загрузите код с Mac через rsync (ниже). Тогда и обновления идут через rsync, а не через `git pull`.

**Запасной вариант без GitHub: rsync с Mac.** Из папки проекта на Mac. Копируются только исходники (около 0,6 МБ), а `.env` и `data/` на сервере при повторных запусках не удаляются:

```bash
rsync -az --delete --exclude node_modules --exclude .next --exclude data --exclude '.env*' --exclude '*.md' --exclude .DS_Store --exclude next-env.d.ts ./ root@5.42.118.104:/opt/trustguard-site/
```

Если заходите по ключу, добавьте `-e "ssh -i ~/.ssh/ВАШ_КЛЮЧ"` после `rsync -az --delete`.

---

## 6. Настройки `.env` и папка для заявок

**На сервере.** Пароли и ключи (SMTP, секрет вебхука) пишутся только сюда и больше никуда.

```bash
cd /opt/trustguard-site
cat > .env <<'EOF'
NEXT_PUBLIC_SITE_URL=https://24trust.ru
NEXT_PUBLIC_YM_ID=
LEADS_FILE=on
EOF
chmod 600 .env
mkdir -p data && chown 1001:1001 data && chmod 700 data
```

`NEXT_PUBLIC_SITE_URL` задаёт адрес сайта для canonical, sitemap, Open Graph и для ссылки на согласие, которая сохраняется с каждой заявкой. Без него сборка остановится. `NEXT_PUBLIC_YM_ID` пока пустой: аналитика выключена, баннер cookie показывает короткое уведомление. Каналы заявок (вебхук в CRM, почта по SMTP) добавляются позже в этот же файл, список переменных в `.env.example` (часть 5.2 чек-листа). После правки `.env` сайт надо пересобрать (шаг 7). Файл `.env` и папка `data/` в git не попадают (они в `.gitignore`), поэтому `git pull` их не затрагивает.

---

## 7. Сборка и запуск

**На сервере.** Боевая сборка (путь A):

```bash
cd /opt/trustguard-site
docker compose up -d --build
```

Черновик с заглушками (путь B), только вместе с паролем из шага 10:

```bash
cd /opt/trustguard-site
ALLOW_PLACEHOLDERS=1 docker compose up -d --build
```

Первая сборка 3–6 минут. Что вы можете увидеть в конце:

- `Container trustguard-site-site-1  Started`: всё хорошо, переходите к проверке ниже.
- `Проверка заглушек: в собранном сайте остались недоделки...`: сработала защита, ниже в выводе список, что осталось (файл и строка). Заполните, отправьте изменения в репозиторий, на сервере сделайте `git pull --ff-only` и повторите сборку, либо выберите путь B.
- Ошибка загрузки образа (`403`, `RBAC: access denied`, `i/o timeout`) на шаге `FROM node:22-alpine`: см. «Если что-то пошло не так».

Проверка, что контейнер живой:

```bash
docker compose ps
curl -sI http://127.0.0.1:3000/ | head -5
docker compose logs --tail 20 site
```

Ожидаем `HTTP/1.1 200 OK` и в логах `Ready`. Снаружи этот порт недоступен: он привязан к `127.0.0.1`, наружу смотрит только nginx.

---

## 8. nginx: сначала простой конфиг для сертификата

Сертификат Let's Encrypt проверяет, что домен ваш, обращаясь по http к файлу в `/.well-known/acme-challenge/`. Поэтому сначала включаем простой конфиг без https.

**На сервере:**

```bash
mkdir -p /var/www/certbot
cat > /etc/nginx/sites-available/24trust.ru <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name 24trust.ru www.24trust.ru;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        default_type text/plain;
        return 200 "24trust.ru: nginx is ready\n";
    }
}
EOF
ln -sf /etc/nginx/sites-available/24trust.ru /etc/nginx/sites-enabled/24trust.ru
nginx -t && systemctl reload nginx
```

Если `nginx -t` ругается на конфликт имён или порт, значит, на сервере уже есть другой сайт на этом домене: вернитесь к шагу 3 и посмотрите вывод `nginx -T`.

Проверка **на Mac** (VPN не мешает):

```bash
curl -i http://24trust.ru/
```

Ожидаем `200` и текст `24trust.ru: nginx is ready`. Если пусто или ошибка, сертификат выпустить не получится: проверьте DNS (`dig +short 24trust.ru` должен дать `5.42.118.104`), файрвол сервера и файрвол в панели хостера (порт 80).

---

## 9. Сертификат Let's Encrypt

**На сервере.** Вместо `ВАШ_EMAIL` подставьте почту, которую читаете: на неё придут предупреждения, если продление сломается.

```bash
certbot certonly --webroot -w /var/www/certbot -d 24trust.ru -d www.24trust.ru -m ВАШ_EMAIL --agree-tos --no-eff-email --deploy-hook "systemctl reload nginx"
```

Ожидаем `Successfully received certificate` и файлы в `/etc/letsencrypt/live/24trust.ru/`. Продление автоматическое (таймер `certbot.timer`), проверить:

```bash
certbot renew --dry-run
```

Если выпуск не получился, причина почти всегда в DNS или в закрытом порте 80, подробности в `/var/log/letsencrypt/letsencrypt.log`.

---

## 10. nginx: итоговый конфиг с https

Теперь, когда сертификат есть, заменяем простой конфиг итоговым: http перенаправляется на https, `www` на основной домен, на `/api/lead` ограничение частоты (5 заявок в минуту с одного адреса, дальше ответ 429, который форма показывает как «слишком много заявок»).

**На сервере:**

```bash
cat > /etc/nginx/sites-available/24trust.ru <<'EOF'
limit_req_zone $binary_remote_addr zone=lead:10m rate=5r/m;

server {
    listen 80;
    listen [::]:80;
    server_name 24trust.ru www.24trust.ru;
    server_tokens off;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://24trust.ru$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.24trust.ru;
    server_tokens off;

    ssl_certificate     /etc/letsencrypt/live/24trust.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/24trust.ru/privkey.pem;

    return 301 https://24trust.ru$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 24trust.ru;
    server_tokens off;

    ssl_certificate     /etc/letsencrypt/live/24trust.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/24trust.ru/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;

    client_max_body_size 64k;

    location /api/lead {
        limit_req zone=lead burst=5 nodelay;
        limit_req_status 429;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
nginx -t && systemctl reload nginx
```

Что важно в этом конфиге:

- IP посетителя для лимита и для доказательства согласия приложение берёт из последнего адреса в `X-Forwarded-For`, поэтому nginx всегда выставляет этот заголовок сам (`$remote_addr` или `$proxy_add_x_forwarded_for`), а Node-сервер наружу не открыт. `X-Real-IP` — запасной вариант, если `X-Forwarded-For` нет: его, как и всё левее последнего адреса, может прислать сам посетитель, если прокси не перезаписывает заголовок.
- Если на новых версиях nginx в `nginx -t` появится предупреждение `the "listen ... http2" directive is deprecated`, это не ошибка: конфиг работает на любых версиях.
- Заголовки безопасности (HSTS, CSP) отдаёт само приложение, в nginx их дублировать не нужно.

**Путь B: пароль на весь сайт.** Добавьте две строки в третий блок `server` (тот, где `server_name 24trust.ru;`), сразу после `server_tokens off;`:

```nginx
    auth_basic           "TrustGuard preview";
    auth_basic_user_file /etc/nginx/.htpasswd-24trust;
```

Создайте пароль (команда спросит его дважды) и перечитайте конфиг:

```bash
apt-get install -y apache2-utils
htpasswd -c /etc/nginx/.htpasswd-24trust preview
nginx -t && systemctl reload nginx
```

Логин `preview`. Проверка сертификатов (`/.well-known/...`) идёт по http и пароль не требует. Когда сайт готов к открытию: удалите две строки, `nginx -t && systemctl reload nginx` и пересоберите сайт без `ALLOW_PLACEHOLDERS` (шаг 7).

---

## 11. Проверка

**На Mac:**

```bash
curl -sI http://24trust.ru | head -4
curl -sI https://www.24trust.ru | head -4
curl -sI https://24trust.ru | head -14
curl -s https://24trust.ru | grep -o 'rel="canonical" href="[^"]*"'
curl -sI https://24trust.ru/fasie-logo.svg | grep -i content-type
curl -s https://24trust.ru/sitemap.xml | grep -c '<loc>https://24trust.ru'
openssl s_client -connect 24trust.ru:443 -servername 24trust.ru </dev/null 2>/dev/null | openssl x509 -noout -issuer -dates
```

Что ожидаем, по строкам:

1. `301` и `location: https://24trust.ru/`.
2. `301` и `location: https://24trust.ru/`.
3. `200`, в заголовках `strict-transport-security` и `content-security-policy` (их отдаёт приложение).
4. `rel="canonical" href="https://24trust.ru"`. Если тут `localhost`, `NEXT_PUBLIC_SITE_URL` не был задан при сборке: поправьте `.env` и пересоберите.
5. `content-type: image/svg+xml`.
6. `3` (три страницы в sitemap).
7. Издатель Let's Encrypt, срок около 90 дней.

Если стоит пароль (путь B), в командах с `curl` добавьте `-u preview:ВАШ_ПАРОЛЬ`.

Глазами в браузере: главная и обе юридические страницы (`/privacy`, `/consent`) открываются, логотип ФСИ на месте, на телефоне 360 px и на широком экране 1440 px нет горизонтальной прокрутки, cookie-баннер появляется. Превью ссылки в Telegram проверьте, отправив адрес себе в чат.

Тестовая заявка (только на боевом сайте, не на черновике): отправьте форму со своими данными, затем **на сервере**:

```bash
tail -n 1 /opt/trustguard-site/data/leads.jsonl
```

В строке должны быть `consentVersion`, `documentUrl` со ссылкой `https://24trust.ru/consent` и `ip` с вашим реальным адресом (не `127.0.0.1` и не `172.x`, иначе nginx не передаёт `X-Real-IP`). Тестовую заявку потом удалите, это персональные данные. Если она последняя в файле:

```bash
cd /opt/trustguard-site/data && sed -i '$d' leads.jsonl && chown 1001:1001 leads.jsonl && chmod 600 leads.jsonl
```

`chown` обязателен: после `sed -i` файл достаётся root, и приложение (пользователь 1001) перестало бы в него писать.

---

## 12. Дальше: обновление, откат, бэкап, очистка

**Обновить сайт.** Изменения сначала отправляются в репозиторий (`git push` с вашего компьютера), затем на сервере. Предыдущий образ сохраняется, чтобы можно было откатиться:

```bash
cd /opt/trustguard-site
git pull --ff-only
docker tag trustguard-site-site:latest trustguard-site-site:prev
docker compose up -d --build
```

`--ff-only` откажется обновляться, если на сервере файлы правили руками: посмотрите `git status`, лишнее уберите (`git checkout -- файл`) и повторите. Если менялся только `.env` (например, `NEXT_PUBLIC_SITE_URL`), `git pull` не нужен: достаточно `docker compose up -d --build`.

**Откатиться.** Быстрый откат образа, без новой сборки:

```bash
cd /opt/trustguard-site
docker tag trustguard-site-site:prev trustguard-site-site:latest
docker compose up -d --no-build
```

Имя образа проверьте командой `docker images`: оно берётся из имени папки проекта. Если нужно вернуться на конкретную версию кода:

```bash
cd /opt/trustguard-site
git log --oneline -10
git checkout КОММИТ
docker compose up -d --build
```

Чтобы после этого снова идти по актуальной версии: `git checkout main && git pull --ff-only`.

**Бэкап заявок** (в них персональные данные: хранить только в РФ, доступ только у ответственных). Раз в сутки архив с хранением 30 дней:

```bash
mkdir -p /root/backups && chmod 700 /root/backups
cat > /etc/cron.d/trustguard-backup <<'EOF'
17 3 * * * root tar -czf /root/backups/data-$(date +\%F).tar.gz -C /opt/trustguard-site data && find /root/backups -name 'data-*.tar.gz' -mtime +30 -delete
EOF
```

Копию архивов нужно ещё и выносить с сервера (в хранилище на территории РФ): иначе при потере сервера пропадут и заявки, и бэкап.

**Очистка старых заявок** (срок хранения 3 года, как в политике). Папки `scripts/` в боевом образе нет, поэтому скрипт запускается во временном контейнере с тем же образом Node, от пользователя 1001, чтобы права на файл не сломались:

```bash
cat > /etc/cron.d/trustguard-leads-purge <<'EOF'
27 3 * * * root docker run --rm --user 1001:1001 -v /opt/trustguard-site/data:/data -v /opt/trustguard-site/scripts:/scripts:ro -e LEADS_DIR=/data node:22-alpine node /scripts/leads-purge.mjs >> /var/log/trustguard-purge.log 2>&1
EOF
```

Проверить вручную можно, убрав из строки `27 3 * * * root` и запустив остальное. Результат пишется в `/var/log/trustguard-purge.log`.

**Логи nginx** хранятся по умолчанию 14 дней. Срок должен совпадать с тем, что написано в политике (сейчас там заглушка `[30 дней]`). Посмотреть и поменять:

```bash
grep -nE 'daily|weekly|rotate' /etc/logrotate.d/nginx
sed -i 's/rotate [0-9]*/rotate 30/' /etc/logrotate.d/nginx
```

Меняйте число 30 на срок, который окончательно останется в политике.

---

## 13. Если что-то пошло не так

| Симптом | Вероятная причина | Что делать |
| --- | --- | --- |
| `docker compose up --build` падает на `FROM node:22-alpine` (`403`, `RBAC: access denied`, `i/o timeout`) | сервер не достаёт до Docker Hub | проверьте, что в `/etc/docker/daemon.json` есть `registry-mirrors` и Docker перезапущен (шаг 4); если не помогло, соберите образ на машине с доступом: `docker build --platform linux/amd64 -t trustguard-site-site:latest --build-arg NEXT_PUBLIC_SITE_URL=https://24trust.ru .`, затем `docker save trustguard-site-site:latest \| ssh root@5.42.118.104 docker load` и на сервере `docker compose up -d --no-build` |
| `apt-get install` пишет `Unable to locate package docker-compose-v2` | в этой версии Ubuntu пакет называется иначе или его нет | поставьте Docker по официальной инструкции (docs.docker.com/engine/install/ubuntu): нужны `docker-ce` и `docker-compose-plugin`; остальные пакеты из шага 4 ставятся отдельно |
| Сборка падает с «Проверка заглушек...» | на сайте остались заглушки | заполните по списку из вывода, отправьте изменения в репозиторий, на сервере `git pull --ff-only` и повторите сборку; или путь B |
| `git clone` пишет `Permission denied (publickey)` | deploy key не добавлен в репозиторий | шаг 5: добавьте публичную часть ключа в Settings → Deploy keys репозитория |
| `git pull` пишет `Not possible to fast-forward` или `would be overwritten` | на сервере правили файлы руками | `git status`, лишнее уберите командой `git checkout -- файл`, повторите; в `main` не делайте `git push --force` |
| Сборка падает с `Killed` или `JavaScript heap out of memory` | не хватает памяти | включите swap (шаг 4), закройте лишнее, повторите |
| Браузер показывает `502 Bad Gateway` | контейнер не запущен | `docker compose ps`, `docker compose logs --tail 50 site`, `docker compose up -d` |
| `nginx -t` пишет `cannot load certificate` | сертификата ещё нет | вернитесь к простому конфигу из шага 8, выпустите сертификат (шаг 9), потом итоговый |
| certbot: `Timeout during connect` или `unauthorized` | порт 80 закрыт или DNS указывает не туда | `ufw status`, файрвол в панели хостера, `dig +short 24trust.ru`; лог `/var/log/letsencrypt/letsencrypt.log` |
| В canonical и sitemap стоит `localhost` | `NEXT_PUBLIC_SITE_URL` не был задан при сборке | поправьте `.env`, `docker compose up -d --build` |
| В заявках `ip` = `127.0.0.1` или `172.x` | nginx не передаёт `X-Real-IP` | сверьте блоки `location` с шагом 10 |
| Форма на сайте пишет «слишком много заявок» с первой попытки | сработал лимит nginx (5 в минуту) или IP не определяется | подождите минуту; если повторяется, проверьте `X-Real-IP` |
| Порты 80 и 443 отвечают пустым ответом по IP | другой сайт или заглушка nginx по умолчанию | это нормально для запроса по IP; запрос по имени `24trust.ru` обслуживает ваш блок `server_name` |
| Сайт открывается по http, а по https нет | не включён итоговый конфиг или закрыт порт 443 | `nginx -T \| grep -n 24trust`, `ufw status`, файрвол в панели хостера |

---

## 14. Перед тем как открыть сайт для всех

- [x] Все заглушки закрыты, `npm run build` без флага проходит (проверено 30.10.2026). Формулировку об обработчиках в политике и согласии проверьте отдельно (чек-лист, часть 2.2)
- [ ] Ящик `info@24trust.ru` создан на российском почтовом сервисе и принимает письма
- [ ] Политику и согласие посмотрел юрист; оператор внесён в реестр Роскомнадзора (чек-лист, часть 2.6)
- [ ] В `.env` на сервере нет `ALLOW_PLACEHOLDERS`, пароль nginx (путь B) убран
- [ ] Выбран и включён хотя бы один канал уведомлений о заявках (вебхук или почта), иначе о заявках никто не узнает
- [ ] Бэкап `data/` настроен и копируется за пределы сервера
- [ ] Срок хранения логов nginx совпадает с политикой
- [ ] HSTS в приложении включает `includeSubDomains`: если на поддоменах `24trust.ru` будет что-то по http, оно перестанет открываться (проверьте, например, веб-почту хостера)
- [ ] На сервере `git status` чистый, а `git log -1` совпадает с последним коммитом в репозитории
