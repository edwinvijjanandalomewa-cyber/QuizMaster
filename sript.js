const setupForm = document.querySelector("#setup-form");
const questionList = document.querySelector("#question-list");
const setupFeedback = document.querySelector("#setup-feedback");
const setupScreen = document.querySelector("#setup-screen");
const gameScreen = document.querySelector("#game-screen");
const resultScreen = document.querySelector("#result-screen");
const answerForm = document.querySelector("#answer-form");
const answerFeedback = document.querySelector("#answer-feedback");
const countdownBlock = document.querySelector("#countdown-block");
const themeInput = document.querySelector("#quiz-theme");
const themeDisplay = document.querySelector("#theme-display");

let questions = [];
let answers = [];
let currentQuestionIndex = 0;
let countdownInterval;
let playerName = "";

function addQuestionRow(question = "", acceptedAnswers = "") {
	const row = document.createElement("div");
	row.className = "question-row";
	row.innerHTML = `
		<div class="question-row-heading">
			<span class="question-number"></span>
			<button class="remove-question" type="button">Hapus soal</button>
		</div>
		<div class="question-fields">
			<div>
				<label class="field-label" for="question-input">Teks pertanyaan</label>
				<input class="text-input question-input" type="text" maxlength="180" placeholder="Contoh: Apa warna bendera Indonesia?" required>
			</div>
			<div>
				<label class="field-label" for="accepted-answer-input">Jawaban benar</label>
				<input class="text-input accepted-answer-input" type="text" maxlength="120" placeholder="Contoh: merah putih" required>
			</div>
		</div>
	`;
	row.querySelector(".question-input").value = question;
	row.querySelector(".accepted-answer-input").value = acceptedAnswers;
	questionList.append(row);
	updateQuestionNumbers();
}

function updateQuestionNumbers() {
	questionList.querySelectorAll(".question-row").forEach((row, index) => {
		row.querySelector(".question-number").textContent = `PERTANYAAN ${String(index + 1).padStart(2, "0")}`;
		row.querySelector(".question-input").id = `question-input-${index + 1}`;
		row.querySelector(".accepted-answer-input").id = `accepted-answer-input-${index + 1}`;
		row.querySelector("label[for^='question-input']").htmlFor = `question-input-${index + 1}`;
		row.querySelector("label[for^='accepted-answer-input']").htmlFor = `accepted-answer-input-${index + 1}`;
	});
}

function showScreen(screen) {
	setupScreen.hidden = screen !== setupScreen;
	gameScreen.hidden = screen !== gameScreen;
	resultScreen.hidden = screen !== resultScreen;
}

function normalizeAnswer(value) {
	return value.trim().toLocaleLowerCase("id-ID").replace(/\s+/g, " ");
}

function startGame() {
	answers = [];
	currentQuestionIndex = 0;
	document.querySelector("#player-label").textContent = playerName;
	showScreen(gameScreen);
	showQuestion();
}

function showQuestion() {
	window.clearInterval(countdownInterval);
	const question = questions[currentQuestionIndex];
	const questionNumber = currentQuestionIndex + 1;
	document.querySelector("#question-progress").textContent = `SOAL ${questionNumber} DARI ${questions.length}`;
	document.querySelector("#progress-fill").style.width = `${(currentQuestionIndex / questions.length) * 100}%`;
	document.querySelector("#game-question").textContent = question.text;
	document.querySelector("#countdown-number").textContent = "5";
	countdownBlock.hidden = false;
	answerForm.hidden = true;
	answerFeedback.hidden = true;
	answerForm.reset();

	let remainingSeconds = 5;
	countdownInterval = window.setInterval(() => {
		remainingSeconds -= 1;
		document.querySelector("#countdown-number").textContent = String(remainingSeconds);
		if (remainingSeconds === 0) {
			window.clearInterval(countdownInterval);
			countdownBlock.hidden = true;
			answerForm.hidden = false;
			document.querySelector("#player-answer").focus();
		}
	}, 1000);
}

function showResults() {
	window.clearInterval(countdownInterval);
	const correctCount = answers.filter((answer) => answer.isCorrect).length;
	document.querySelector("#result-player").textContent = playerName;
	document.querySelector("#score-fraction").textContent = `${correctCount}/${questions.length}`;
	document.querySelector("#score-percent").textContent = `${Math.round((correctCount / questions.length) * 100)}%`;
	document.querySelector("#progress-fill").style.width = "100%";

	const review = document.querySelector("#result-review");
	review.replaceChildren();
	answers.forEach((answer, index) => {
		const item = document.createElement("article");
		item.className = answer.isCorrect ? "review-item is-correct" : "review-item is-wrong";

		const question = document.createElement("p");
		question.className = "review-question";
		question.textContent = `${index + 1}. ${answer.question}`;

		const submitted = document.createElement("p");
		submitted.className = "review-answer";
		submitted.textContent = `Jawabanmu: ${answer.submitted || "(kosong)"}`;

		const expected = document.createElement("p");
		expected.className = "review-answer";
		expected.textContent = `Jawaban benar: ${answer.acceptedAnswers.join(", ")}`;

		item.append(question, submitted, expected);
		review.append(item);
	});
	showScreen(resultScreen);
}

document.querySelector("#add-question").addEventListener("click", () => {
	addQuestionRow();
	setupFeedback.hidden = true;
	questionList.lastElementChild.querySelector(".question-input").focus();
});

questionList.addEventListener("click", (event) => {
	if (!event.target.matches(".remove-question")) return;
	event.target.closest(".question-row").remove();
	updateQuestionNumbers();
});

setupForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const rows = [...questionList.querySelectorAll(".question-row")];
	if (rows.length === 0) {
		setupFeedback.textContent = "Tambahkan minimal satu pertanyaan sebelum memulai.";
		setupFeedback.hidden = false;
		return;
	}

	const nextQuestions = rows.map((row) => ({
		text: row.querySelector(".question-input").value.trim(),
		acceptedAnswers: row.querySelector(".accepted-answer-input").value
			.split(",")
			.map((answer) => answer.trim())
			.filter(Boolean),
	}));
	if (nextQuestions.some((question) => !question.text || question.acceptedAnswers.length === 0)) {
		setupFeedback.textContent = "Isi setiap pertanyaan dan minimal satu jawaban yang benar.";
		setupFeedback.hidden = false;
		return;
	}

	questions = nextQuestions;
	playerName = document.querySelector("#player-name").value.trim();
	setupFeedback.hidden = true;
	startGame();
});

answerForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const question = questions[currentQuestionIndex];
	const submitted = document.querySelector("#player-answer").value.trim();
	const isCorrect = question.acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalizeAnswer(submitted));
	answers.push({ ...question, submitted, isCorrect });

	const feedbackMessage = document.querySelector("#feedback-message");
	feedbackMessage.textContent = isCorrect ? "Benar!" : "Belum tepat.";
	feedbackMessage.classList.toggle("is-wrong", !isCorrect);
	document.querySelector("#correct-answer").textContent = `Jawaban benar: ${question.acceptedAnswers.join(", ")}`;
	answerForm.hidden = true;
	answerFeedback.hidden = false;
	document.querySelector("#continue-button").innerHTML = currentQuestionIndex === questions.length - 1
		? "Lihat skor <span aria-hidden=\"true\">-&gt;</span>"
		: "Soal berikutnya <span aria-hidden=\"true\">-&gt;</span>";
});

document.querySelector("#continue-button").addEventListener("click", () => {
	if (currentQuestionIndex === questions.length - 1) {
		showResults();
		return;
	}
	currentQuestionIndex += 1;
	showQuestion();
});

document.querySelector("#play-again").addEventListener("click", startGame);
document.querySelector("#edit-game").addEventListener("click", () => showScreen(setupScreen));

themeInput.addEventListener("input", () => {
	themeDisplay.textContent = themeInput.value.trim() || "Tema belum ditentukan";
});

addQuestionRow();
