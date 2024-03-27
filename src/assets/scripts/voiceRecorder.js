class VoiceRecorder {
	transcribing = false;
	
	constructor() {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			console.log("getUserMedia supported")
		} else {
			console.log("getUserMedia is not supported on your browser!")
		}

		console.log(navigator.mediaDevices.enumerateDevices());

		this.mediaRecorder
		this.stream
		this.chunks = []
		this.isRecording = false
		this.completeStream
		this.completeUrlStream

		this.recorderRef = document.querySelector("#recorder")
		this.playerRef = document.querySelector("#player")
		this.startRef = document.querySelector("#start")
		this.stopRef = document.querySelector("#stop")
		this.transcribeRef = document.querySelector("#transcribe")
		this.bedrockTextRef = document.querySelector("#bedrockText")
		
		this.startRef.onclick = this.startRecording.bind(this)
		this.stopRef.onclick = this.stopRecording.bind(this)
		this.transcribeRef.onclick = this.transcribe.bind(this)

	
		this.constraints = {
			audio: true,
			video: false
		}
	}

	handleSuccess(stream) {
		this.stream = stream
		this.stream.oninactive = () => {
			console.log("Stream ended!")
		};
		this.recorderRef.srcObject = this.stream
		this.mediaRecorder = new MediaRecorder(this.stream)
		console.log(this.mediaRecorder)
		this.mediaRecorder.ondataavailable = this.onMediaRecorderDataAvailable.bind(this)
		this.mediaRecorder.onstop = this.onMediaRecorderStop.bind(this)
		this.recorderRef.play()
		this.mediaRecorder.start()
		
	}

	handleError(error) {
		console.log("navigator.getUserMedia error: ", error)
	}
	
	onMediaRecorderDataAvailable(e) { 
		this.chunks.push(e.data)
	}
	
	onMediaRecorderStop(e) { 
		const blob = new Blob(this.chunks, { 'type': 'audio/ogg; codecs=opus' })
		const audioURL = window.URL.createObjectURL(blob)
		this.playerRef.src = audioURL
		this.completeStream = blob
		this.completeUrlStream = audioURL
		
		this.chunks = []
		this.stream.getAudioTracks().forEach(track => track.stop())

		this.stream = null
	}

	startRecording() {
		if (this.isRecording) return
		if (window.voiceRecorder.transcribing) return;
		var bedrockText = document.getElementById("bedrockText");
		bedrockText.setAttribute("hidden", true);
		this.isRecording = true
		this.startRef.innerHTML = 'Recording...'
		this.playerRef.src = ''
		navigator.mediaDevices
			.getUserMedia(this.constraints)
			.then(this.handleSuccess.bind(this))
			.catch(this.handleError.bind(this))
	}
	
	stopRecording() {
		if (!this.isRecording) return
		if (window.voiceRecorder.transcribing) return;
		this.isRecording = false
		this.startRef.innerHTML = 'Record'
		this.recorderRef.pause()
		this.mediaRecorder.stop()

		this.transcribeRef.removeAttribute("hidden");
	}

	transcribe() {
		if (window.voiceRecorder.transcribing) return;
		window.voiceRecorder.transcribing = true;
		this.transcribeRef.innerHTML = 'Transcribing....';
		document.getElementById("progress-bar").removeAttribute("hidden")
		document.getElementById("progress-text").removeAttribute("hidden")
		const headers = {
			'Content-Type': 'multipart/form-data'
		  }
		axios.post('/api/transcribe', this.completeStream, {
			headers:headers,
			}).then(function (response) {
				var bedrockText = document.getElementById("bedrockText");
				console.log(response.data);
				var str = response.data;
				const lines = (String(str).match(/\n/g) || '').length + 3
				var transcribe = document.getElementById("transcribe");
				transcribe.innerHTML = 'Transcribe';
				bedrockText.removeAttribute("hidden");
				bedrockText.setAttribute("rows", lines) // for firefox
				bedrockText.rows = lines; // for chrome 
				document.getElementById("progress-bar").setAttribute("hidden", true)
				document.getElementById("progress-text").setAttribute("hidden", true) // write code to deal with all progress-bar
				bedrockText.textContent = response.data;
				window.voiceRecorder.transcribing = false;
				
			})
			.catch(function (error) {
				console.log(error);
		});
	}
	
}

window.voiceRecorder = new VoiceRecorder()