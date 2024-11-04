from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from streamcat.store import NothingToPutbackException, NoResultsException
from streamcat.store.auth import NotAuthorizedException
from streamcat.store.lock import LockedDatumException
from .utils import Status, BadRequestException, InvalidAcceptHeader, NotAuthenticationException

def error_content(error_code:int, ex:Exception):
    return {
        'code'   : error_code,
        'message': str(ex)
    }

def register_exception_handlers(app:FastAPI):
    @app.exception_handler(LockedDatumException)
    async def LockedDatumExceptionHandler(request:Request, ex:LockedDatumException):
        return JSONResponse(status_code=Status.LOCKED, content=error_content(-2, ex))

    @app.exception_handler(NothingToPutbackException)
    async def NothingToPutbackExceptionHandler(request:Request, ex:NothingToPutbackException):
        return JSONResponse(status_code=Status.PRECONDITION_FAILED, content=error_content(-3, ex))

    @app.exception_handler(NoResultsException)
    async def NoResultsExceptionHandler(request:Request, ex:NoResultsException):
        return JSONResponse(status_code=Status.INERNAL_SERVER_ERROR, content=error_content(-4, ex))

    @app.exception_handler(NotAuthenticationException)
    async def NotAuthenticationExceptionHandler(request:Request, ex:NotAuthenticationException):
        if ex.has_response:
            return ex.response
        else:
            return JSONResponse(status_code=Status.UNAUTHORIZED, content=error_content(-1, ex))

    @app.exception_handler(NotAuthorizedException)
    async def NotAuthorizedExceptionHandler(request:Request, ex:NotAuthorizedException):
        return JSONResponse(status_code=Status.FORBIDDEN, content=error_content(-1, ex))

    @app.exception_handler(InvalidAcceptHeader)
    async def InvalidAcceptHeaderHandler(request:Request, ex:InvalidAcceptHeader):
        return JSONResponse(status_code=Status.NOT_ACCEPTABLE, content=error_content(-1, ex))

    @app.exception_handler(BadRequestException)
    async def BadRequestExceptionHandler(request:Request, ex:BadRequestException):
        return JSONResponse(status_code=Status.BAD_REQUEST, content=error_content(-1, ex))
