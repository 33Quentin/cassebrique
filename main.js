// import * as THREE from 'three';
import * as THREE from './node_modules/three/build/three.module.js';


const canvas = document.getElementById('myCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(77, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true // transparence de la toile
});

// Ajoutez cette fonction pour mettre à jour la taille de la scène et de la caméra
function updateSceneAndCameraSize() {
  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;

  // Mettez à jour la taille de la scène (correspond à la taille du canvas)
  renderer.setSize(canvasWidth, canvasHeight);

  // Mettez à jour la taille de la caméra pour correspondre au canvas
  camera.aspect = canvasWidth / canvasHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', () => {
  updateSceneAndCameraSize();
});

// Appelez la fonction initiale pour configurer la taille
updateSceneAndCameraSize();

//la taille de la scène (et donc du rendu) correspond à la taille de la fenêtre du navigateur
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


camera.position.set(0, 0, 10);



const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Couleur, Intensité
scene.add(ambientLight);
const light = new THREE.PointLight(0xffffff, 1000)
light.position.set(10, 10, 10)
scene.add(light)

// Création de la balle
const ballGeometry = new THREE.SphereGeometry(0.2, 32, 32);
const ballMaterial = new THREE.MeshPhysicalMaterial({ color: 0xff0000, roughness: 0.5, metalness: 0.5, emissive: 0x000000 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.y = -4; // Position de départ en y
scene.add(ball);

// Gestion des niveaux
let currentLevel = 1;
let maxLevels = 3; // Nombre total de niveaux
let bricksPerLevel = 32; // Nombre de briques par niveau


// Création de la raquette
const paddleGeometry = new THREE.BoxGeometry(2, 0.2, 0.5);
const paddleMaterial = new THREE.MeshPhysicalMaterial({ color: 0x00ff00, roughness: 0.5, metalness: 0.5, emissive: 0x000000 });
const paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
paddle.position.y = -5; // Position de départ en y
scene.add(paddle);

function createBricks() {
    const brickGeometry = new THREE.BoxGeometry(1, 0.5, 0.5);
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0x800080, 0xffa500, 0x008000];

    const totalBrickWidth = 20 * 1.2; // Largeur totale de toutes les briques
    

    const startX = -totalBrickWidth / 2; // Position de départ en x
    const startY = 6;

    for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 10; j++) {
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const brickMaterial = new THREE.MeshPhysicalMaterial({ color: randomColor, roughness: 0.5, metalness: 0.5, emissive: 0x000000 });
            const brick = new THREE.Mesh(brickGeometry, brickMaterial);
            brick.position.x = startX + i * 1.2;
            brick.position.y = startY - j * 0.8;
            scene.add(brick);
        }
    }
}



function clearBricks() {
    const bricks = scene.children.filter(object => object instanceof THREE.Mesh && object !== ball && object !== paddle);
    bricks.forEach(brick => scene.remove(brick));
}

function nextLevel() {
    if (currentLevel < maxLevels) {
        currentLevel++;
        clearBricks();
        createBricks();
        const levelElement = document.getElementById('levelDisplay');
        levelElement.textContent = `Niveau: ${currentLevel}`;
    } else {
        alert("Félicitations, vous avez terminé tous les niveaux !");
    }
}

  // Gestion du score
let score = 0;

function updateScore(points) {
  score += points;
  const scoreElement = document.getElementById('scoreDisplay');
  scoreElement.textContent = `Score: ${score}`;
}

// Gestion des interactions utilisateur--------------------------------------------------------------------------------

let isGameActive = true;


let targetPaddleX = 0;

function handleMouseMove(event) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    targetPaddleX = mouseX * 10; // Ajustez la sensibilité ici
}

function updatePaddlePosition() {
    // Ajustement de la vitesse de déplacement de la raquette
    const speed = 0.1;

    const delta = targetPaddleX - paddle.position.x;
    paddle.position.x += delta * speed;

    // Limitez la position de la raquette pour qu'elle reste à l'intérieur du canvas
    if (paddle.position.x < -10) {
        paddle.position.x = -10;
    } else if (paddle.position.x > 9) {
        paddle.position.x = 9;
    }
}

  
function checkCollisions() {
    // Collision avec les briques
    let bricksRemoved = 0;
    scene.children.forEach((object) => {
      if (object instanceof THREE.Mesh && object !== ball && object !== paddle) {
        const boundingBox = new THREE.Box3().setFromObject(object);
        const ballBox = new THREE.Box3().setFromObject(ball);
  
        if (boundingBox.intersectsBox(ballBox)) {
          // Collision détectée avec une brique
          scene.remove(object);
          bricksRemoved++;
  
          // Inversez la direction de la balle sur l'axe Y
          ballSpeedY = -ballSpeedY;
        }
      }
    });
  
    if (bricksRemoved > 0) {
      updateScore(bricksRemoved); // Mettez à jour le score ici
    }
  
    if (bricksRemoved === bricksPerLevel * maxLevels) {
      nextLevel(); // Chargez le niveau suivant
    }
  
    // Collision avec la raquette
    const boundingBoxPaddle = new THREE.Box3().setFromObject(paddle);
    if (boundingBoxPaddle.intersectsBox(new THREE.Box3().setFromObject(ball))) {
        // Collision détectée avec la raquette
        const ballCenter = new THREE.Vector3();
        ball.getWorldPosition(ballCenter);

        const paddleCenter = new THREE.Vector3();
        paddle.getWorldPosition(paddleCenter);

        const offset = ballCenter.x - paddleCenter.x;
        const normalizedOffset = offset / (paddle.geometry.parameters.width / 2);

        ballSpeedY = -ballSpeedY;

        // Ajustez ballSpeedX en fonction de normalizedOffset pour changer la direction horizontale
        ballSpeedX = normalizedOffset * 0.1; // Vous pouvez ajuster le facteur selon votre préférence
        ball.position.y = paddle.position.y + 0.5;


        // Cela permettra à la balle de rebondir de manière plus naturelle en fonction de la position de collision sur la raquette
        ballSpeedY += normalizedOffset * 0.05;
        if (ball.position.y > paddle.position.y) {
            ball.position.y = paddle.position.y + 0.5;
        }
    }
}

// penser a concorder la position max de la balle et les rebords
function checkWallCollision() {
    if (ball.position.x <= -12 || ball.position.x >= 10) ballSpeedX = -ballSpeedX;
    if (ball.position.y <= -7) {
      if (ball.position.y < paddle.position.y) {
        isGameActive = false;
        gameOver();
    }
    }
}

  
  
// Logique du jeu
let ballSpeedX = 0.08;
let ballSpeedY = 0.08;

function animate() {
    requestAnimationFrame(animate);
    if (!isGameActive) return;

    const speed = 0.8;
    ball.position.x += ballSpeedX * speed;
    ball.position.y += ballSpeedY * speed;
    console.log('Position de la balle :', ball.position.x, ball.position.y);

  
    checkCollisions();
    checkWallCollision();
  
    // Gestion des rebonds (sur les rebords)
    if (ball.position.x <= -13 || ball.position.x >= 11) ballSpeedX = -ballSpeedX;
    if (ball.position.y <= -5 || ball.position.y >= 5) ballSpeedY = -ballSpeedY;
  
    // Détection de collision avec la raquette
    if (ball.position.x < paddle.position.x + 2.5 &&
        ball.position.x > paddle.position.x - 2.5 &&
        ball.position.y < paddle.position.y + 0.5 &&
        ball.position.y > paddle.position.y - 0.5) {
      ballSpeedY = -ballSpeedY;
      const offset = ball.position.x - paddle.position.x;
      const normalizedOffset = offset / (paddle.geometry.parameters.width / 2);

      ballSpeedX = normalizedOffset * 0.1;
      ballSpeedY += normalizedOffset * 0.05;
      if (ball.position.y > paddle.position.y) {
        ball.position.y = paddle.position.y + 0.5;
    }
    }
  
    if (ball.position.y <= -5) {
      isGameActive = false;
      gameOver();
    }
    
    updatePaddlePosition();
  renderer.render(scene, camera);
}

function gameOver() {
    alert("Game Over");
    
  } 
// Appel initial pour démarrer le jeu

document.addEventListener('mousemove', handleMouseMove);
createBricks();


animate();
