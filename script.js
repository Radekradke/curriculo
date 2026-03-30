
const elements = document.querySelectorAll(
  '.empresa, .faculdade-box, .cursos, .softskills'
);

const observerScroll = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('show');
    }
  });
}, {
  threshold: 0.2
});

elements.forEach(el => observerScroll.observe(el));

const texto = document.querySelector(".projetos-texto");
function typeEffectHTML(element){
  const originalHTML = element.innerHTML;
  element.innerHTML = "";
  element.classList.add("typing");

  let i = 0;

  function getSpeed(char){
    if(char === " "){
      return 20;
    }
    if(char === "." || char === "," ){
      return 120;
    }
    return Math.random() * 40 + 30; 
  }
function typing(){
  const char = originalHTML.charAt(i);

  if(char === "<"){
    const closeTag = originalHTML.indexOf(">", i);
    element.innerHTML = originalHTML.slice(0, closeTag + 1);
    i = closeTag + 1;
  } else {
    element.innerHTML = originalHTML.slice(0, i + 1);
    i++;
  }

  if(i < originalHTML.length){
    setTimeout(typing, getSpeed(char));
  } else {
    element.classList.remove("typing");
  }
}

  setTimeout(typing, 300);
}
const observerTyping = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      typeEffectHTML(entry.target);
      observerTyping.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.6
});

observerTyping.observe(texto);