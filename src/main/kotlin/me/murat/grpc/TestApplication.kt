package me.murat.grpc

import io.grpc.BindableService
import io.grpc.Server
import io.grpc.ServerBuilder
import io.grpc.protobuf.services.ProtoReflectionService
import kotlinx.coroutines.delay
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger("application")

class GrpcTestService : TestServiceGrpcKt.TestServiceCoroutineImplBase() {
    private val serviceLogger = LoggerFactory.getLogger("service")

    override suspend fun executeUnary(request: SampleRequest): SampleResponse {
        if (request.delay in 1..<1000) {
            serviceLogger.trace("Will delay for ${request.delay}ms..")
            delay(request.delay.toLong())
        }
        return sampleResponse {
            delay = request.delay
            someResponse = "Run finished"
        }
    }
}

class GrpcServer(
    private val port: Int,
    private val services: List<BindableService>
) {
    private val server: Server = ServerBuilder
        .forPort(port)
        .apply { services.forEach { this.addService(it) } }
        .build()

    fun start() {
        server.start()
        logger.info("Server started, listening on $port")
        Runtime.getRuntime().addShutdownHook(
            Thread {
                logger.info("*** shutting down gRPC server since JVM is shutting down")
                this@GrpcServer.stop()
                logger.info("*** server shut down")
            },
        )
    }

    private fun stop() {
        server.shutdown()
    }

    fun blockUntilShutdown() {
        server.awaitTermination()
    }
}

fun main() {
    val port = System.getenv("PORT")?.toInt() ?: 50051
    val server = GrpcServer(port, listOf(GrpcTestService(), ProtoReflectionService.newInstance()))
    server.start()
    server.blockUntilShutdown()
}
