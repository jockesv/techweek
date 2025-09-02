// Vänta på att DOM:en är laddad innan vi kör koden
document.addEventListener('DOMContentLoaded', function() {
    // Hämta schemakontainern
    const scheduleContainer = document.getElementById('schedule-container');
    
    // Funktion för att skapa föreläsningselement
    function createLectureElement(lecture) {
        const lectureDiv = document.createElement('div');
        lectureDiv.className = 'lecture';
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'lecture-time';
        timeDiv.innerHTML = `<i class="far fa-clock"></i> ${lecture.time}`;
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'lecture-title';
        titleDiv.textContent = lecture.title;
        
        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'lecture-description';
        descriptionDiv.textContent = lecture.description;
        
        lectureDiv.appendChild(timeDiv);
        lectureDiv.appendChild(titleDiv);
        lectureDiv.appendChild(descriptionDiv);
        
        return lectureDiv;
    }
    
    // Funktion för att skapa dagskort
    function createDayCard(dayData) {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        
        const dayTitle = document.createElement('h3');
        dayTitle.textContent = `${dayData.day} - ${dayData.date}`;
        
        dayHeader.appendChild(dayTitle);
        dayCard.appendChild(dayHeader);
        
        const dayContent = document.createElement('div');
        dayContent.className = 'day-content';
        
        // Skapa föreläsnings-element för varje föreläsning
        dayData.lectures.forEach(lecture => {
            const lectureElement = createLectureElement(lecture);
            dayContent.appendChild(lectureElement);
        });
        
        dayCard.appendChild(dayContent);
        
        return dayCard;
    }
    
    // Ladda och rendera schemat
    async function loadSchedule() {
        try {
            // Hämta JSON-data
            const response = await fetch('schedule.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const schedule = data.techweek.schedule;
            
            // Rensa befintligt innehåll
            scheduleContainer.innerHTML = '';
            
            // Skapa och lägg till dagskort för varje dag
            schedule.forEach((dayData, index) => {
                const dayCard = createDayCard(dayData);
                scheduleContainer.appendChild(dayCard);
            });
            
        } catch (error) {
            console.error('Error loading schedule:', error);
            
            // Visa felmeddelande om något går fel
            scheduleContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #dc2626;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <h3>Kunde inte ladda schemat</h3>
                    <p>Försök ladda om sidan eller kontakta administratören.</p>
                </div>
            `;
        }
    }
    
    // Ladda schemat direkt
    loadSchedule();
    
    // Smooth scrolling för navigeringslänkar
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Lägg till scroll-effekt för header
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.style.boxShadow = 'var(--shadow-lg)';
        } else {
            header.style.boxShadow = 'var(--shadow-sm)';
        }
    });
    
    // Intersection Observer för animationer när element kommer in i viewport
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observera alla dagars kort när de har skapats
    setTimeout(() => {
        document.querySelectorAll('.day-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }, 100);
});