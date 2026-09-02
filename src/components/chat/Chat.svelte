<script lang="ts">
  import {getRollLog} from "$lib/engine";
  import {onDestroy, getContext} from "svelte";
  import {differenceInMilliseconds, format} from 'date-fns'
  import {type ChatLog, detectAction, getReplicateLog} from "$lib/chat";
  import ChatItem from "./ChatItem.svelte";
  import { userProfile } from "$lib/stores/auth.store";

  const {unsubscribeRoll, rollStore} = getRollLog()
  const {unsubscribeReplicate, replicateStore} = getReplicateLog()
  
  // Get dialog state from context to disable chat when dialogs are open
  const dialogState = getContext<{isAnyDialogOpen: boolean, setDialogState: (isOpen: boolean) => void}>('dialogState');
  let isDialogOpen = $derived(dialogState?.isAnyDialogOpen || false);

  onDestroy(() => {
    unsubscribeRoll()
    unsubscribeReplicate()
    
  })

  let chatLog: ChatLog = $derived.by(() => {
    const rollItems = $rollStore.map(curr => ({
      createdAt: new Date(curr.rolledAt),
      type: 'roll' as const,
      data: curr
    }));

    const chatItems = $replicateStore.map(curr => ({
      createdAt: curr.sentAt,
      type: 'chat' as const,
      data: curr
    }));

    return [...rollItems, ...chatItems].sort((a, b) => {
      return differenceInMilliseconds(a.createdAt, b.createdAt)
    })
  })

  let chatInput: string = $state("")
  let stateThinking = $state<string | undefined>(undefined)
  let stateError = $state<string | undefined>(undefined)
  let showHidden = $state<boolean>(false)
  let scroller: HTMLElement
  
  // Audio recording state
  let isRecording = $state(false)
  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []
  

  $effect(() => {
    chatLog.length || stateThinking?.length || stateError?.length || showHidden;
    scroller.scrollTo(0, scroller.scrollHeight)
  })

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      onSend(e)
    }
  }

  function onSend(e: Event) {
    e.preventDefault()
    e.stopPropagation()

    if (!chatInput.length) {
      return
    }

    stateThinking = "Thinking about it"
    detectAction(chatInput).then(() => stateThinking = undefined).catch((err: any) => {
      stateThinking = undefined
      stateError = err.message || 'An error occurred'
    })
    if (document.activeElement && 'blur' in document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
    chatInput = ''
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder = new MediaRecorder(stream)
      audioChunks = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        await transcribeAudio(audioBlob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      isRecording = true
    } catch (error) {
      console.error('Error starting recording:', error)
      stateError = 'Could not access microphone'
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      isRecording = false
    }
  }

  async function transcribeAudio(audioBlob: Blob) {
    try {
      stateThinking = "Converting speech to text..."
      
      const apiKey = $userProfile?.replicate_api_key
      if (!apiKey) {
        throw new Error("Replicate API key is missing")
      }
      
      // Convert to data URL format that Replicate expects
      const audioDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(audioBlob)
      })

      console.log('Attempting transcription with audio data length:', audioDataUrl.length)
      
      const requestBody = {
        stream: false,
        input: {
          audio: audioDataUrl
        }
      }
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2))
      
      const response = await fetch('/replicate/models/thomasmol/whisper-diarization/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          url: response.url
        })
        throw new Error(`Transcription failed: ${response.status} - ${errorText}`)
      }

      const resp = await response.json()
      let getUrl: string | undefined = resp?.urls?.get
      
      if (!getUrl) {
        throw new Error(`Invalid response - no polling URL provided`)
      }
      
      // Use the same polling pattern as the main chat system
      const result = await pollWhisperResult(getUrl, apiKey)
      
      // Handle the transcription result
      if (result && typeof result === 'string' && result.trim()) {
        chatInput = result.trim()
        stateThinking = undefined
        // Auto-send the transcribed text
        setTimeout(() => {
          if (chatInput.trim()) {
            onSend(new Event('submit'))
          }
        }, 100)
      } else {
        stateError = 'No transcription text received'
        stateThinking = undefined
      }
      
    } catch (error) {
      console.error('Error transcribing audio:', error)
      stateError = `Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`
      stateThinking = undefined
    }
  }

  const pollWhisperResult = (getUrl: string, apiKey: string): Promise<string> => new Promise((resolve, reject) => {
    let retries = 1;
    const maxRetries = 15;
    
    const poll = () => {
      if (retries > maxRetries) {
        reject(new Error('Transcription timeout after 15 retries'));
        return;
      }
      
      setTimeout(async () => {
        try {
          console.log(`Polling Whisper result, attempt ${retries}`);
          stateThinking = `Converting speech to text... (${retries}/${maxRetries})`
          
          const res = await fetch(getUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + apiKey
            },
          })

          const response = await res.json()
          console.log('Whisper polling response:', response)

          if (response.status === 'succeeded') {
            // Handle different response formats for Whisper
            let transcription = ''
            if (typeof response.output === 'string') {
              transcription = response.output
            } else if (response.output?.transcription) {
              transcription = response.output.transcription
            } else if (response.output?.text) {
              transcription = response.output.text
            } else if (Array.isArray(response.output)) {
              transcription = response.output.join(' ')
            }
            
            if (transcription && transcription.trim()) {
              resolve(transcription.trim())
            } else {
              reject(new Error('No transcription text in response'))
            }
          } else if (response.status === 'failed') {
            reject(new Error(`Transcription failed: ${response.error || 'Unknown error'}`))
          } else if (response.status === 'canceled') {
            reject(new Error('Transcription was canceled'))
          } else {
            // Still processing, continue polling
            retries++;
            poll()
          }
        } catch (error) {
          console.error('Error in Whisper polling:', error)
          reject(error)
        }
      }, 2000) // Poll every 2 seconds
    }
    
    poll()
  })

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:audio/webm;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  function toggleChat() {
    const currentState = document.documentElement.style.getPropertyValue('--size-chat-curr');
    const newState = currentState === 'var(--size-chat-max)' ? '0' : 'var(--size-chat-max)';
    document.documentElement.style.setProperty('--size-chat-curr', newState);
  }


</script>

<div class="root" class:disabled={isDialogOpen}>
    <button class="toggle-chat" onclick={toggleChat} title="Chat" aria-label="Toggle chat">
      <svg class="morphing-chat-icon" viewBox="0 0 24 24" fill="currentColor">
        <path class="morph-chat-path">
          <animate attributeName="d" 
            values="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z;
                    M6,6H18A2,2 0 0,1 20,8V14A2,2 0 0,1 18,16H6A2,2 0 0,1 4,14V8A2,2 0 0,1 6,6Z;
                    M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z"
            dur="0.3s" 
            begin="hover" 
            fill="freeze" />
          <animate attributeName="d"
            values="M6,6H18A2,2 0 0,1 20,8V14A2,2 0 0,1 18,16H6A2,2 0 0,1 4,14V8A2,2 0 0,1 6,6Z;
                    M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z"
            dur="0.3s"
            begin="mouseout"
            fill="freeze" />
        </path>
        <circle class="robot-antenna" cx="12" cy="4" r="1" opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="0.3s" begin="hover" fill="freeze" />
          <animate attributeName="opacity" values="1;0" dur="0.3s" begin="mouseout" fill="freeze" />
        </circle>
        <g class="robot-eyes" opacity="0">
          <circle cx="9" cy="9" r="1"/>
          <circle cx="15" cy="9" r="1"/>
          <animate attributeName="opacity" values="0;1;0" dur="0.3s" begin="hover" fill="freeze" />
          <animate attributeName="opacity" values="1;0" dur="0.3s" begin="mouseout" fill="freeze" />
        </g>
        <rect class="robot-mouth" x="9" y="12" width="6" height="1.5" rx="0.75" opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="0.3s" begin="hover" fill="freeze" />
          <animate attributeName="opacity" values="1;0" dur="0.3s" begin="mouseout" fill="freeze" />
        </rect>
        <g class="robot-speakers" opacity="0">
          <rect x="4" y="8" width="2" height="4" rx="1"/>
          <rect x="18" y="8" width="2" height="4" rx="1"/>
          <animate attributeName="opacity" values="0;1;0" dur="0.3s" begin="hover" fill="freeze" />
          <animate attributeName="opacity" values="1;0" dur="0.3s" begin="mouseout" fill="freeze" />
        </g>
      </svg>
      <div class="mip-particles">
        <div class="mip-text mip-1">mip</div>
        <div class="mip-text mip-2">mip</div>
      </div>
    </button>

    <div class="inner">
        <div class="scroll" bind:this={scroller}>
            <ul>
                {#each chatLog as logItem}
                    <ChatItem {logItem} {showHidden} />
                {/each}
            </ul>
        </div>
        {#if stateThinking || stateError}
            <div class="status" class:error={stateError?.length}>
                <span class="thinking">{stateThinking || stateError}</span>
            </div>
        {/if}
        <div class="input" class:disabled={Boolean(stateThinking?.length || stateError?.length || isDialogOpen)}>
            <textarea bind:value={chatInput} onkeydown={onKeyDown}></textarea>
            <div class="actions">
                <button onclick={() => showHidden = !showHidden}><span>Show</span></button>
                <button 
                    class="audio-btn" 
                    class:recording={isRecording}
                    onclick={toggleRecording}
                    disabled={Boolean(stateThinking?.length || stateError?.length || isDialogOpen)}
                    title={isRecording ? 'Stop recording' : 'Start voice recording'}
                >
                    <span>{isRecording ? '⏹️' : '🎤'}</span>
                </button>
                <button onclick={onSend}><span>Send</span></button>
            </div>
        </div>
    </div>
</div>

<style>
    .root {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-left: 1px solid var(--metal);
        background-color: var(--ground);
        z-index: 100;
    }

    .toggle-chat {
        position: absolute;
        top: 20px;
        right: -50px;
        z-index: 200;
        width: 50px;
        height: 50px;
        background: transparent;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--ink);
        padding: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: visible;
    }

    .morphing-chat-icon {
        width: 24px;
        height: 24px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        filter: drop-shadow(0 2px 4px var(--shade-soft));
    }

    .toggle-chat:hover .morphing-chat-icon {
        transform: scale(1.1);
        color: var(--verdigris);
        filter: drop-shadow(0 0 8px color-mix(in srgb, var(--verdigris) 62%, transparent)) drop-shadow(0 0 16px color-mix(in srgb, var(--verdigris) 42%, transparent));
    }

    .toggle-chat:hover {
        transform: scale(1.15) translateY(-2px);
    }

    .toggle-chat:active .morphing-chat-icon {
        transform: scale(1.3) rotate(10deg);
        color: var(--verdigris);
        filter: drop-shadow(0 0 12px var(--verdigris)) drop-shadow(0 0 24px var(--verdigris));
    }

    .mip-particles {
        position: absolute;
        pointer-events: none;
        top: 50%;
        left: -60px;
        transform: translateY(-50%);
    }

    .mip-text {
        position: absolute;
        font-size: 12px;
        font-weight: bold;
        color: var(--verdigris);
        opacity: 0;
        transform: translateX(0);
        text-shadow: 0 0 4px color-mix(in srgb, var(--verdigris) 62%, transparent);
        font-family: var(--font-mono);
        white-space: nowrap;
    }

    .toggle-chat:active .mip-text {
        animation: mip-shout 0.8s ease-out;
    }

    .mip-1 { 
        top: -8px;
        animation-delay: 0s; 
    }
    .mip-2 { 
        top: 8px;
        animation-delay: 0.2s; 
    }

    .toggle-chat:active {
        transform: scale(0.9) translateY(1px);
    }

    @keyframes mip-shout {
        0% {
            opacity: 0;
            transform: translateX(0) scale(0.5);
        }
        20% {
            opacity: 1;
            transform: translateX(-10px) scale(1);
        }
        80% {
            opacity: 1;
            transform: translateX(-30px) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateX(-50px) scale(0.8);
        }
    }

    .inner {
        position: absolute;
        width: var(--size-sidebar-max);
        min-width: var(--size-sidebar-max);
        left: 0;
        top: 0;
        bottom: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .scroll {
        position: relative;
        width: 100%;
        height: 100%;
        flex: 1;
        display: flex;
        flex-direction: column-reverse;
        justify-content: end;
        align-items: start;
        overflow: hidden;
        overflow-y: scroll;
    }

    .input {
        position: relative;
        width: 100%;
        height: auto;
        display: flex;
        justify-content: stretch;
        align-items: center;
        flex-direction: row;
        border-top: 2px solid var(--metal);
        overflow: hidden;
        background: linear-gradient(135deg, 
            var(--ground-raised) 0%, 
            color-mix(in srgb, var(--ground-raised) 95%, var(--ember)) 50%,
            var(--ground-raised) 100%);
        box-shadow: 
            inset 0 2px 4px var(--shade-soft),
            0 -2px 8px var(--shade-soft);
        border-radius: 12px 12px 0 0;
    }

    .input > textarea {
        position: relative;
        width: 100%;
        height: 150px;
        border: none;
        overflow: auto;
        resize: none;
        background: linear-gradient(145deg, 
            color-mix(in srgb, var(--ground-raised) 98%, var(--ember)) 0%,
            var(--ground-raised) 100%);
        color: var(--ink);
        padding: 20px;
        margin: 8px;
        outline: none;
        font-family: var(--font-display);
        font-size: 16px;
        line-height: 1.5;
        border-radius: 12px;
        border: 2px solid transparent;
        box-shadow: 
            inset 0 2px 6px var(--shade-soft),
            0 1px 3px var(--shade-soft);
        transition: all 0.3s ease;
    }

    .input > textarea:focus {
        border-color: var(--ember);
        box-shadow: 
            inset 0 2px 6px var(--shade-soft),
            0 0 0 3px color-mix(in srgb, var(--ember) 30%, transparent),
            0 2px 8px var(--shade-soft);
        background: linear-gradient(145deg, 
            color-mix(in srgb, var(--ground-raised) 95%, var(--ember)) 0%,
            var(--ground-raised) 100%);
    }

    .input > textarea::placeholder {
        color: color-mix(in srgb, var(--ink) 60%, transparent);
        font-style: italic;
    }

    .actions > button {
        position: relative;
        width: 100%;
        height: 100%;
        outline: none;
        border: none;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(145deg, var(--metal-dim), color-mix(in srgb, var(--metal-dim) 85%, black));
        color: var(--ink);
        border-radius: 8px;
        border: 2px solid color-mix(in srgb, var(--metal) 60%, transparent);
        box-shadow: 
            0 2px 6px var(--shade-soft),
            inset 0 1px 3px var(--sheen-soft);
        transition: all 0.2s ease;
        font-family: var(--font-display);
        font-weight: 600;
        text-shadow: 0 1px 2px var(--shade);
        margin: 4px;
    }

    .actions > button:hover {
        background: linear-gradient(145deg, var(--ember), color-mix(in srgb, var(--ember) 85%, black));
        border-color: var(--ember);
        box-shadow: 
            0 4px 8px var(--shade-soft),
            inset 0 1px 3px var(--sheen);
        transform: translateY(-1px);
    }

    .actions > button:active {
        transform: translateY(0);
        box-shadow: 
            0 1px 3px var(--shade-soft),
            inset 0 2px 4px var(--shade-soft);
    }

    .actions > button:first-child {
        background-color: var(--metal);
        height: min-content;
        padding: 8px;
    }

    .audio-btn {
        background: linear-gradient(145deg, var(--ember), color-mix(in srgb, var(--ember) 85%, black)) !important;
        border-color: var(--ember) !important;
    }

    .audio-btn:hover {
        background: linear-gradient(145deg, var(--ember-glow), var(--ember)) !important;
        border-color: var(--ember-glow) !important;
        transform: translateY(-1px) scale(1.02);
    }

    .audio-btn.recording {
        background: linear-gradient(145deg, var(--state-bad), var(--state-bad)) !important;
        border-color: var(--state-bad) !important;
        animation: pulse 1s infinite;
        box-shadow: 
            0 0 10px color-mix(in srgb, var(--state-bad) 22%, transparent),
            0 2px 6px var(--shade-soft),
            inset 0 1px 3px var(--sheen-soft);
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }

    ul {
        position: relative;
        width: 100%;
        height: auto;
        margin: 0;
        padding: 0;
        list-style: none;
        background-color: var(--ground-lift);
        color: var(--ink);
    }

    .disabled {
        user-select: none;
        pointer-events: none;
        cursor: default;
        opacity: 0.5;
    }

    .disabled > * {
        user-select: none;
        pointer-events: none;
        cursor: default;
        opacity: 0.65;
    }
    
    .root.disabled {
        filter: grayscale(0.5);
        pointer-events: none;
        user-select: none;
    }

    .actions {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: stretch;
        align-items: center;
        flex-direction: column;
        flex: 0;
    }

    .status {
        position: relative;
        width: 100%;
        height: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        border-top: 1px solid var(--metal);
    }

    .status.error {
        border-color: red;
        color: red;
    }
</style>
