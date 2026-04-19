import {WebSocketServer, WebSocket} from "ws"
import { getPrediction } from "../services/predictionService.js"

export function attatchToWebSocketServer(server){
    const wss = new WebSocketServer({
        noServer:true
    });

    server.on('upgrade',(req,socket,head)=>{
        if(req.url=== '/ws/audio'){
            wss.handleUpgrade(req,socket,head,(ws)=>{
                wss.emit('connection',ws,req);
            });
        } else if(req.url === '/ws'){
            wss.handleUpgrade(req,socket,head,(ws)=>{
                wss.emit('test-connection',ws,req);
            });
        }
    });

    wss.on('connection',(reactWs)=>{
        console.log("✅ React Connected ; Opening tunnel to Python....");

        const pythonWs = new WebSocket('ws://127.0.0.1:8001/ws');

        // Track Python connection status
        pythonWs.on('open', () => {
            console.log("✅ Python WebSocket connected successfully!");
            reactWs.send(JSON.stringify({
                type: 'status',
                message: 'Connected to Python backend'
            }));
        });

        pythonWs.on('message', async (data)=>{
            const text = data.toString();
            console.log("📩 Message from Python:", text.substring(0, 100));

            // Intercept gemini_result, enrich with prediction, then forward
            try {
                const parsed = JSON.parse(text);
                if (parsed.type === 'gemini_result' && parsed.result) {
                    const geminiResult = parsed.result;
                    console.log("🧠 Enriching Gemini result with ML prediction...");

                    const { prediction, predictionError, mlPayload } = await getPrediction(geminiResult);

                    const enrichedResult = {
                        ...geminiResult,
                        ml_prediction: prediction,
                        ml_prediction_error: predictionError,
                        ml_payload_sent: mlPayload
                    };

                    console.log("📤 Sending enriched result to React");
                    reactWs.send(JSON.stringify({
                        type: 'gemini_result',
                        session_id: parsed.session_id,
                        result: enrichedResult
                    }));
                    return;
                }
            } catch {
                // Not JSON or parse error, forward as-is
            }

            reactWs.send(text);
        });

        reactWs.on('message', (data, isBinary)=> {
            if(pythonWs.readyState===WebSocket.OPEN){
                console.log("📤 Forwarding to Python (size:", data.length, "bytes, isBinary:", isBinary, ")");
                pythonWs.send(data, { binary: isBinary });
            } else {
                console.warn("⚠️ Python WebSocket not ready. State:", pythonWs.readyState);
            }
        });

        reactWs.on('close',()=>{
            console.log("❌ React disconnected");
            if(pythonWs.readyState===WebSocket.OPEN) pythonWs.send('stop');
            pythonWs.close()
        });

        pythonWs.on('error',(err)=>{
            console.error('❌ Python WebSocket error:', err.message);
            console.error('   Make sure Python server is running on ws://localhost:8081/ws');
            reactWs.send(JSON.stringify({
                type: 'error',
                message: 'Python backend connection failed. Is the Python server running?'
            }));
            reactWs.close();
        });

        pythonWs.on('close', (code, reason) => {
            console.log("❌ Python WebSocket closed. Code:", code, "Reason:", reason.toString());
        });
    });

    // Simple test endpoint
    wss.on('test-connection',(ws)=>{
        console.log("Test WebSocket connected");
        
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'WebSocket connection established',
            timestamp: new Date().toISOString()
        }));

        ws.on('message', (data)=> {
            console.log('Received from client:', data.toString());
            ws.send(JSON.stringify({
                type: 'echo',
                message: data.toString(),
                timestamp: new Date().toISOString()
            }));
        });

        ws.on('close',()=>{
            console.log("Test WebSocket disconnected");
        });

        ws.on('error',(err)=>{
            console.error('Test WebSocket error',err);
        });
    });
}