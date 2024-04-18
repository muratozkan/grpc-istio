FROM amazoncorretto:21.0.2
WORKDIR /app

COPY build/libs/grpc-istio-jar-with-dependencies.jar ./grpc-istio.jar

EXPOSE 7777

ENV PORT                7777
ENV JAVA_TOOL_OPTIONS   "-XX:+ExitOnOutOfMemoryError -XX:MaxRAMPercentage=50"

ENTRYPOINT java \
    -jar /app/grpc-istio.jar \
    $0 $@
