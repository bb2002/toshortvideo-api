FROM ubuntu
MAINTAINER ballbot <5252bb@daum.net>

RUN mkdir -p /app/dist
WORKDIR /app
COPY ./ /app

RUN apt-get update && \
    apt-get install -y \
    xvfb libgl1-mesa-glx libxi-dev libglu1-mesa-dev \
    libglew-dev libglfw3-dev ffmpeg make build-essential \
    curl pkg-config

ENV DISPLAY=:99

# NodeJS 16 설치 (Editly 패키지 의존성 고려)
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | sh
RUN apt-get install nodejs -y

# Python 3 명령어를 기본으로 설정
RUN ln -s /usr/bin/python3 /usr/bin/python

# 패키지 빌드
RUN npm ci
RUN npm install -g pm2 @5252bb/editly
RUN npm run build

# entrypoint 실행 모드
RUN ["chmod", "+x", "/app/entrypoint.sh"]


EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]