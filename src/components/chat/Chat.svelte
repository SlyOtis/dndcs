<script lang="ts">
  import {onDestroy, getContext} from "svelte";
  import {type ChatLog, detectAction, getChatLog} from "$lib/chat";
  import ChatItem from "./ChatItem.svelte";
  import { userDetails } from "$lib/stores/auth.store";
  import Sigil from "$components/ui/Sigil.svelte";
  import Glyph from "$components/ui/Glyph.svelte";

  const {unsubscribeChat, chatStore} = getChatLog()

  // Get dialog state from context to disable chat when dialogs are open
  const dialogState = getContext<{isAnyDialogOpen: boolean, setDialogState: (isOpen: boolean) => void}>('dialogState');
  let isDialogOpen = $derived(dialogState?.isAnyDialogOpen || false);

  onDestroy(() => {
    unsubscribeChat()
  })

  let chatLog: ChatLog = $derived($chatStore)

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
      
      const apiKey = $userDetails?.replicate_api_key
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

</script>

<div class="root" class:disabled={isDialogOpen}>
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
                <Sigil
                    title={showHidden ? 'Hide hidden entries' : 'Show hidden entries'}
                    size="sm"
                    active={showHidden}
                    onclick={() => showHidden = !showHidden}
                >
                    <Glyph name={showHidden ? 'conceal' : 'reveal'} size="sm" />
                </Sigil>

                <Sigil
                    title={isRecording ? 'Stop recording' : 'Start voice recording'}
                    tone={isRecording ? 'bane' : 'ember'}
                    size="sm"
                    active={isRecording}
                    disabled={Boolean(stateThinking?.length || stateError?.length || isDialogOpen)}
                    onclick={toggleRecording}
                >
                    {isRecording ? '■' : '🜄'}
                </Sigil>

                <Sigil title="Send" tone="metal" size="sm" frame="star" onclick={onSend}>
                    <Glyph name="send" size="sm" />
                </Sigil>
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
        background-color: var(--ground);
        z-index: 100;
    }

    .inner {
        position: absolute;
        width: 100%;
        min-width: 0;
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
        align-items: flex-end;
        flex-direction: row;
        border-top: var(--border-hair) solid var(--metal-dim);
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
        min-height: calc(var(--text-sm) * 4.5);
        max-height: 40vh;
        field-sizing: content;
        overflow-y: auto;
        resize: none;
        margin: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: linear-gradient(180deg, var(--ground-deep) 0%, var(--ground) 100%);
        color: var(--ink);
        outline: none;
        font-family: var(--font-body);
        font-size: var(--text-sm);
        line-height: 1.45;
        border: var(--border-hair) solid var(--metal-dim);
        border-radius: var(--radius-md);
        box-shadow: inset 0 2px 6px var(--shade-hard);
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
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
        display: flex;
        flex: none;
        flex-direction: column;
        align-items: stretch;
        justify-content: center;
        gap: var(--space-1);
        align-self: stretch;
        padding: var(--space-2) var(--space-2) var(--space-2) 0;
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
