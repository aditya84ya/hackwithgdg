import { GoogleGenAI, Modality } from "@google/genai";

// Initialize Gemini Client
// In a real app, ensure API_KEY is handled securely (e.g., backend proxy)
// For this demo, we assume process.env.API_KEY is available via the environment
export const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// --- Maps Grounding (Lead Finder) ---
export const findLeadsWithMaps = async (query: string, location: { lat: number; lng: number }) => {
  const ai = getGeminiClient();
  if (!ai) throw new Error("AI Client not initialized");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find potential leads for: ${query}. List their business names, addresses, and PHONE NUMBERS if available. It is crucial to get phone numbers for calling.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.lat,
              longitude: location.lng,
            },
          },
        },
      },
    });
    
    // Extracting grounding chunks for display
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const text = response.text || "No results found.";
    
    return { text, chunks };
  } catch (error) {
    console.error("Maps Error:", error);
    throw error;
  }
};

// --- TTS (Voice Preview) ---
export const generateSpeechPreview = async (text: string, voiceName: string = 'Kore') => {
  const ai = getGeminiClient();
  if (!ai) throw new Error("AI Client not initialized");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

// --- Audio Helpers ---
// Decodes raw PCM data (Int16) to an AudioBuffer
const decodePCM = (base64String: string, ctx: AudioContext, sampleRate: number = 24000) => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create Int16Array view of the data
  const dataInt16 = new Int16Array(bytes.buffer);
  
  // Create AudioBuffer
  const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  // Convert Int16 to Float32 [-1.0, 1.0]
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
};

export const playAudioFromBase64 = async (base64String: string) => {
  // Create context with specific sample rate if possible, though decodePCM handles resampling if needed by the destination,
  // typically we create a context that matches the content or let the browser handle it.
  // Gemini TTS/Live usually returns 24kHz.
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  // Manually decode PCM instead of using decodeAudioData (which expects WAV/MP3 headers)
  const audioBuffer = decodePCM(base64String, audioContext, 24000);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start(0);
};