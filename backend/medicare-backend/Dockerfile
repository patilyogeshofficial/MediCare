
# Stage 1: Build Spring Boot application
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Stage 2: Run Spring Boot application
FROM eclipse-temurin:21-jre

WORKDIR /app

# Install temporary network diagnostic tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends netcat-openbsd dnsutils \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Diagnose Supabase connectivity before starting Spring Boot
ENTRYPOINT ["sh", "-c", "echo '=== SUPABASE DNS TEST ==='; getent hosts aws-0-ap-southeast-1.pooler.supabase.com || true; echo '=== SUPABASE TCP TEST ==='; nc -vz -w 5 aws-0-ap-southeast-1.pooler.supabase.com 6543; echo '=== STARTING MEDICARE BACKEND ==='; exec java -jar app.jar"]
