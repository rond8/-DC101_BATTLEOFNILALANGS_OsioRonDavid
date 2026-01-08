  const video = document.getElementById("loading-video");
    const loadingScreen = document.getElementById("loading-screen");
    const content = document.getElementById("content");

    video.addEventListener("ended", () => {
        loadingScreen.classList.add("hidden");

        setTimeout(() => {
            loadingScreen.remove();
        }, 500); // match fade duration
    });


function closediv(n,n2){
  div=document.getElementById(n);
  div.style.display="none";
  if(n2){
    div2=document.getElementById(n2);
    div2.style.display="flex";
  }
}

const openBtn = document.getElementById("openControlsBtn");
const closeBtn = document.getElementById("closeControlsBtn");
const dialog = document.getElementById("controlsDialog");

openBtn.onclick = () => dialog.classList.remove("hidden");
closeBtn.onclick = () => dialog.classList.add("hidden");

// Optional: close when clicking outside
dialog.onclick = e => {
  if (e.target === dialog) dialog.classList.add("hidden");
};

const originalBg = '';

document.querySelectorAll('.choices').forEach(button => {
  button.addEventListener('mouseenter', () => {
    const bg = button.dataset.bg;
    const previews = document.getElementsByClassName("char_prev");

    for (let i = 0; i < previews.length; i++) {
      previews[i].style.backgroundImage = `url('${bg}')`;
      previews[i].style.backgroundSize = 'cover';
      previews[i].style.backgroundPosition = 'center';
    }
  });

  button.addEventListener('mouseleave', () => {
    const previews = document.getElementsByClassName("char_prev");

    for (let i = 0; i < previews.length; i++) {
      previews[i].style.backgroundImage = originalBg;
    }
  });
});
