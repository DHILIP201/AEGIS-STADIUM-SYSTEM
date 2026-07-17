import asyncio
import json
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from simulation.engine import SimulationEngine

app = FastAPI(title="AEGIS OS", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = SimulationEngine()


class NLRequest(BaseModel):
    query: str


class ScenarioRequest(BaseModel):
    scenario: str


class SpeedRequest(BaseModel):
    speed: float


@app.get("/")
def root():
    return {
        "name": "AEGIS OS Backend",
        "status": "running",
        "version": "2.0"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    last_real_time = time.time()
    try:
        while True:
            now = time.time()
            delta = now - last_real_time
            last_real_time = now
            engine.advance(delta)
            state = engine.get_state()
            await websocket.send_text(json.dumps(state))
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.001)
                msg = json.loads(data)
                msg_type = msg.get("type", "")
                if msg_type == "nl":
                    engine._nl_response = engine.handle_nl(msg.get("query", ""))
                elif msg_type == "scenario":
                    engine.apply_scenario(msg.get("scenario", ""))
                elif msg_type == "speed":
                    engine.set_speed(float(msg.get("speed", 5)))
                elif msg_type == "reset":
                    engine.reset()
            except asyncio.TimeoutError:
                pass
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")


@app.post("/api/nl")
async def natural_language(request: NLRequest):
    response = engine.handle_nl(request.query)
    engine._nl_response = response
    return {"response": response}


@app.post("/api/scenario")
async def scenario(request: ScenarioRequest):
    engine.apply_scenario(request.scenario)
    return {"status": "ok", "scenario": request.scenario}


@app.post("/api/speed")
async def set_speed(request: SpeedRequest):
    engine.set_speed(request.speed)
    return {"speed": request.speed}


@app.post("/api/reset")
async def reset_engine():
    engine.reset()
    return {"status": "reset"}


@app.get("/api/report")
async def get_report():
    return {"report": engine.generate_report()}


@app.get("/api/state")
async def get_state():
    return engine.get_state()
