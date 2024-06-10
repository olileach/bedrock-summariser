var bedrockRunning = false;
const architectureResults = document.getElementById("architectureResults");
const architectureInput = document.getElementById("architectureInput");
const architectureButton = document.getElementById("architectureButton");
var file64base;

architectureButton.addEventListener("click", async function(event) {
	event.preventDefault();
	file64base = await fileDataURL( architectureInput.files[0]);
	file = file64base.replace(/^data:image\/[a-z]+;base64,/, "");
	console.log("Passing in " + architectureInput.value + " to Bedrock.");
	architectureReviewer(file);
	var image = document.getElementById('output');
	image.src = file64base;
	image.removeAttribute("hidden")
});

const fileDataURL = file => new Promise((resolve,reject) => {
    let fileRead = new FileReader();
    fileRead.onload = () => resolve( fileRead.result);
    fileRead.onerror = reject;
    fileRead.readAsDataURL( file)
});

var loadFile = function() {
    var image = document.getElementById('output');
    image.src = URL.createObjectURL(file64base);
  };

const architectureReviewer = (data) => {
	if (bedrockRunning) return;
	bedrockRunning = true;
	architectureResults.setAttribute("hidden", true);
	document.getElementById("progress-bar").removeAttribute("hidden");
	document.getElementById("progress-text").removeAttribute("hidden");
	const headers = {
		'Content-Type': 'application/json',
		'X-Model-Name': "anthropic.claude-3-sonnet-20240229-v1:0"
	};

	axios.post('/api/architecture', data, {
		headers:headers,
		}).then(function (response) {
			var str = response.data;
			const lines = (String(str).match(/\n/g) || '').length + 3;
			architectureResults.removeAttribute("hidden");
			architectureResults.setAttribute("rows", lines); // for firefox
			architectureResults.rows = lines; // for chrome 
			document.getElementById("progress-bar").setAttribute("hidden", true);
			document.getElementById("progress-text").setAttribute("hidden", true); // write code to deal with all progress-bar
			architectureResults.textContent = response.data;
			document.getElementById('model-form').reset();
			bedrockRunning = false;
			
		})
		.catch(function (error) {
			console.log(error);
	});
}