let songs = [];
let currentSong = null;
let score = 0;
let total = 0;
let maskPercentage = 0.2; // Valeur initiale

// Charger les chansons depuis localStorage au démarrage
function loadSongsFromStorage() {
  const storedSongs = localStorage.getItem('songs');
  if (storedSongs) {
    songs = JSON.parse(storedSongs);
    updateSongLists();
    updateSongDropdown();
  }
}

// Sauvegarder les chansons dans localStorage
function saveSongsToStorage() {
  localStorage.setItem('songs', JSON.stringify(songs));
}

function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.getElementById(tabId).classList.add('active');
}

function addSong() {
  const title = document.getElementById('song-title').value.trim();
  const lyrics = document.getElementById('song-lyrics').value.trim();
  const status = document.getElementById('song-status').value;

  if (title && lyrics) {
    // Vérifie si le titre existe déjà (insensible à la casse)
    if (songs.some(song => song.title.toLowerCase() === title.toLowerCase())) {
      alert("Une chanson avec ce titre existe déjà.");
      return;
    }

    songs.push({ title, lyrics, status });
    saveSongsToStorage();
    document.getElementById('song-title').value = '';
    document.getElementById('song-lyrics').value = '';
    document.getElementById('song-status').value = 'non apprise';
    updateSongLists();
    updateSongDropdown();
    alert('Chanson ajoutée avec succès !');
  } else {
    alert('Veuillez remplir tous les champs.');
  }
}

function updateSongLists() {
  const unlearned = songs.filter(song => song.status === "non apprise");
  const inProgress = songs.filter(song => song.status === "en cours");
  const learned = songs.filter(song => song.status === "apprise");

  const updateList = (listId, songsArray, counterId) => {
    const list = document.getElementById(listId);
    list.innerHTML = '';
    songsArray.forEach(song => {
      const li = document.createElement('li');
      li.textContent = song.title;
      li.onclick = () => startRevision(song.title);

      // Ajout du bouton de suppression pour chaque chanson
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = "Supprimer";
      deleteBtn.onclick = () => deleteSong(song.title);
      li.appendChild(deleteBtn);

      list.appendChild(li);
    });
    document.getElementById(counterId).textContent = songsArray.length;
  };

  updateList("unlearned-list", unlearned, "count-unlearned");
  updateList("in-progress-list", inProgress, "count-in-progress");
  updateList("learned-list", learned, "count-learned");
}

function updateSongDropdown() {
  const dropdown = document.getElementById('song-dropdown');
  dropdown.innerHTML = '';

  // Tri alphabétique
  const sortedSongs = [...songs].sort((a, b) => a.title.localeCompare(b.title));

  sortedSongs.forEach(song => {
    const option = document.createElement('option');
    option.textContent = song.title;
    dropdown.appendChild(option);
  });

  // Si une chanson est déjà sélectionnée, on commence la révision automatiquement
  dropdown.onchange = function() {
    const selectedTitle = dropdown.value;
    if (selectedTitle) {
      startRevision(selectedTitle);
    }
  };
}

function startRevision(title) {
  const song = songs.find(s => s.title === title);
  if (!song) return;

  currentSong = song;
  score = 0;
  total = 0;
  displayQuiz(song);
  switchTab("quiz");
}

function displayQuiz(song) {
  const contentDiv = document.getElementById('quiz-content');
  contentDiv.innerHTML = '';
  document.getElementById('quiz-title').textContent = `Révision : ${song.title}`;

  const words = song.lyrics.split(/\s+/);
  const totalWords = words.length;
  const numToMask = Math.floor(totalWords * maskPercentage);
  const indices = [];

  // Masquer des mots selon le pourcentage
  while (indices.length < numToMask) {
    const randIndex = Math.floor(Math.random() * totalWords);
    if (!indices.includes(randIndex)) {
      indices.push(randIndex);
    }
  }

  words.forEach((word, index) => {
    if (indices.includes(index)) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'blank';
      input.placeholder = '...'; // Accessibilité
      input.dataset.answer = word;
      contentDiv.appendChild(input);
    } else {
      const span = document.createElement('span');
      span.textContent = word + ' ';
      contentDiv.appendChild(span);
    }
  });

  // Ajout bouton "Vérifier"
  const checkBtn = document.createElement('button');
  checkBtn.textContent = "Vérifier mes réponses";
  checkBtn.onclick = checkAnswers;
  contentDiv.appendChild(document.createElement('br'));
  contentDiv.appendChild(checkBtn);
}

function checkAnswers() {
  const inputs = document.querySelectorAll('input.blank');
  let correct = 0;

  // Fonction pour normaliser les mots : enlever la ponctuation et mettre en minuscules
  function normalize(text) {
    return text
      .toLowerCase()
      .normalize("NFD") // pour supprimer accents si tu veux plus tard
      .replace(/[\u0300-\u036f]/g, "") // suppression des accents
      .replace(/[.,!?;:"'()\-]/g, "") // suppression ponctuation
      .trim();
  }

  inputs.forEach(input => {
    const correctAnswer = normalize(input.dataset.answer);
    const userAnswer = normalize(input.value);

    if (userAnswer === correctAnswer) {
      input.classList.add('correct');
      correct++;
    } else {
      input.classList.add('incorrect');
      const correction = document.createElement('span');
      correction.textContent = ` (${input.dataset.answer})`;
      correction.classList.add('correction');
      input.parentNode.insertBefore(correction, input.nextSibling);
    }
  });

  score = correct;
  total = inputs.length;
  document.getElementById('quiz-score').textContent = `Score: ${score} / ${total}`;

  if (score / total >= 0.8) {
    currentSong.status = "apprise";
  } else if (score / total >= 0.5) {
    currentSong.status = "en cours";
  }

  saveSongsToStorage();
  updateSongLists();

  const replayBtn = document.createElement('button');
  replayBtn.textContent = "Rejouer le quiz";
  replayBtn.onclick = () => displayQuiz(currentSong);
  document.getElementById('quiz-content').appendChild(document.createElement('br'));
  document.getElementById('quiz-content').appendChild(replayBtn);
}

// Fonction pour changer le pourcentage de masquage des mots
function changeMaskPercentage() {
  const percentageInput = document.getElementById('mask-percentage').value;
  const percentage = parseFloat(percentageInput) / 100;

  if (percentage >= 0 && percentage <= 1) {
    maskPercentage = percentage;
    alert(`Le pourcentage des mots masqués a été modifié à ${Math.round(maskPercentage * 100)}%`);
    
    // Recalculer et mettre à jour le quiz avec le nouveau pourcentage de masquage
    if (currentSong) {
      displayQuiz(currentSong); // Reafficher la chanson avec le nouveau masque
    }
  } else {
    alert('Veuillez entrer un pourcentage valide entre 0 et 100');
  }
}

// Fonction pour supprimer une chanson
function deleteSong(title) {
  // Demander confirmation avant de supprimer
  if (confirm(`Êtes-vous sûr de vouloir supprimer "${title}" ?`)) {
    songs = songs.filter(song => song.title !== title);
    saveSongsToStorage();
    updateSongLists();
    updateSongDropdown();
  }
}

window.onload = function() {
  loadSongsFromStorage();
  document.getElementById('mask-percentage').addEventListener('input', changeMaskPercentage); // Écouteur pour changer le pourcentage
};