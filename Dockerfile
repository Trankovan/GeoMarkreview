FROM gradle:7.6.1-jdk17 AS build
WORKDIR /app
COPY . .
ENV GRADLE_OPTS="-Dorg.gradle.daemon=false -Dorg.gradle.jvmargs=-Xmx2048m -XX:+HeapDumpOnOutOfMemoryError"
RUN gradle build --no-daemon

FROM openjdk:17-slim
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]