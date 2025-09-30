// Vänta på att DOM:en är laddad innan vi kör koden
document.addEventListener('DOMContentLoaded', function() {
    // Hämta schemakontainern
    const scheduleContainer = document.getElementById('schedule-container');
    
    // Funktion för att skapa föreläsningselement
    function createLectureElement(lecture, date) {
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
        
        // Truncate description to 100 characters if needed
        const truncatedDescription = lecture.description.length > 100
            ? lecture.description.substring(0, 100)
            : lecture.description;
        descriptionDiv.textContent = truncatedDescription;
        
        // Add class if description is truncated
        if (lecture.description.length > 100) {
            descriptionDiv.classList.add('truncated');
        }
        
        // Store full description for modal
        descriptionDiv.setAttribute('data-full-description', lecture.description);
        descriptionDiv.setAttribute('data-title', lecture.title);
        descriptionDiv.setAttribute('data-time', lecture.time);
        descriptionDiv.setAttribute('data-date', date);
        // Store teams link (may be empty)
        descriptionDiv.setAttribute('data-teams-link', lecture['teams-link'] || '');
        
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
            const lectureElement = createLectureElement(lecture, dayData.date);
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

    // Modal functionality
    const modal = document.getElementById('lecture-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalTime = document.querySelector('.modal-time');
    const modalDescription = document.querySelector('.modal-description');
    const modalClose = document.querySelector('.modal-close');
    const outlookButton = document.getElementById('add-to-outlook');
    const teamsButton = document.getElementById('open-in-teams');

    // Current lecture data for Outlook integration
    let currentLecture = null;

    // Function to generate ICS file content
    function generateICSContent(lecture) {
        // Parse the date and time to create a proper date object
        const dateMap = {
            '29 september': '20250929',
            '30 september': '20250930',
            '1 oktober': '20251001',
            '2 oktober': '20251002',
            '3 oktober': '20251003'
        };

        const lectureDate = dateMap[lecture.date];
        const timeStart = lecture.time.split(' - ')[0];
        const timeEnd = lecture.time.split(' - ')[1];

        // Create start and end datetime strings in local time (Europe/Stockholm, UTC+2)
        const startDateTime = `${lectureDate}T${timeStart.replace(':', '')}00`;
        const endDateTime = `${lectureDate}T${timeEnd.replace(':', '')}00`;

        // Create ICS content with proper timezone handling
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GDC Techweek//Event//EN
BEGIN:VTIMEZONE
TZID:Europe/Stockholm
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:${Date.now()}@gdctechweek.se
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;TZID=Europe/Stockholm:${startDateTime}
DTEND;TZID=Europe/Stockholm:${endDateTime}
SUMMARY:${lecture.title}
DESCRIPTION:${lecture.description.replace(/\\n/g, '\\\\n')}
LOCATION:GDC Office
END:VEVENT
END:VCALENDAR`;

        return icsContent;
    }

    // Function to open ICS file inline
    function openICSFileInline(lecture) {
        const icsContent = generateICSContent(lecture);
        const blob = new Blob([icsContent], {
            type: 'text/calendar;charset=utf-8',
            ending: '\n'
        });
        
        // Create object URL with proper MIME type
        const url = URL.createObjectURL(blob);
        
        // Create a new window/tab to open the file
        const newWindow = window.open(url, '_blank');
        
        // Clean up after a delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
            if (newWindow) {
                newWindow.close();
            }
        }, 1000);
    }

    // Function to download ICS file (fallback)
    function downloadICSFile(lecture) {
        const icsContent = generateICSContent(lecture);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${lecture.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    // Function to generate Outlook calendar URL
    function generateOutlookUrl(lecture) {
        // Parse the date and time to create a proper date object
        const currentYear = 2025;
        const dateMap = {
            '29 september': '2025-09-29',
            '30 september': '2025-09-30',
            '1 oktober': '2025-10-01',
            '2 oktober': '2025-10-02',
            '3 oktober': '2025-10-03'
        };

        const lectureDate = dateMap[lecture.date];
        const timeStart = lecture.time.split(' - ')[0];
        const timeEnd = lecture.time.split(' - ')[1];

        // Create start and end datetime strings in UTC format
        const startDateTime = `${lectureDate}T${timeStart.replace(':', '')}00`;
        const endDateTime = `${lectureDate}T${timeEnd.replace(':', '')}00`;

        // Encode the parameters for the URL
        const subject = encodeURIComponent(lecture.title);
        const body = encodeURIComponent(lecture.description);
        const location = encodeURIComponent('GDC Office');

        // Outlook Web URL format
        const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${subject}&startdt=${startDateTime}&enddt=${endDateTime}&body=${body}&location=${location}`;

        return outlookUrl;
    }

    // Function to open modal
    function openModal(title, time, description, date, teamsLink) {
        modalTitle.textContent = title;
        modalTime.innerHTML = `<i class="far fa-clock"></i> ${time}`;
        modalDescription.textContent = description;
        
        // Store current lecture data for Outlook integration and Teams
        currentLecture = {
            title: title,
            time: time,
            description: description,
            date: date,
            teamsLink: teamsLink || ''
        };
        
        // Enable or disable the Teams button depending on availability
        if (teamsButton) {
            if (currentLecture.teamsLink) {
                teamsButton.removeAttribute('disabled');
                teamsButton.style.display = ''; // ensure visible
            } else {
                teamsButton.setAttribute('disabled', 'true');
                teamsButton.style.display = 'none';
            }
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Function to close modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        currentLecture = null; // Clear current lecture data
    }

    // Add to Outlook button event listener
    outlookButton.addEventListener('click', function() {
        if (currentLecture) {
            // Try to open ICS file inline first
            openICSFileInline(currentLecture);
        }
    });
    
    // Add to Teams button event listener
    if (teamsButton) {
        teamsButton.addEventListener('click', function() {
            if (currentLecture && currentLecture.teamsLink) {
                // Open the Teams meeting URL in a new tab/window
                window.open(currentLecture.teamsLink, '_blank');
            }
        });
    }

    // Homeautomation modal functionality
    const homeautomationLink = document.getElementById('homeautomation-link');
    const homeautomationModal = document.getElementById('homeautomation-modal');
    const homeautomationClose = homeautomationModal.querySelector('.modal-close');

    // Function to open homeautomation modal
    function openHomeautomationModal() {
        homeautomationModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Function to close homeautomation modal
    function closeHomeautomationModal() {
        homeautomationModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Add click event listener to homeautomation link
    homeautomationLink.addEventListener('click', function(e) {
        e.preventDefault();
        openHomeautomationModal();
    });

    // Close homeautomation modal when clicking the close button
    homeautomationClose.addEventListener('click', closeHomeautomationModal);

    // Close homeautomation modal when clicking outside the modal content
    homeautomationModal.addEventListener('click', function(e) {
        if (e.target === homeautomationModal) {
            closeHomeautomationModal();
        }
    });

    // Close homeautomation modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && homeautomationModal.classList.contains('active')) {
            closeHomeautomationModal();
        }
    });

    // Prevent homeautomation modal content clicks from closing the modal
    homeautomationModal.querySelector('.modal-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Add click event listeners to entire lecture blocks
    document.addEventListener('click', function(e) {
        const lectureElement = e.target.closest('.lecture');
        if (lectureElement) {
            const descriptionElement = lectureElement.querySelector('.lecture-description');
            const title = descriptionElement.getAttribute('data-title');
            const time = descriptionElement.getAttribute('data-time');
            const description = descriptionElement.getAttribute('data-full-description');
            const date = descriptionElement.getAttribute('data-date');
            const teamsLink = descriptionElement.getAttribute('data-teams-link');
            openModal(title, time, description, date, teamsLink);
        }
    });

    // Close modal when clicking the close button
    modalClose.addEventListener('click', closeModal);

    // Close modal when clicking outside the modal content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Prevent modal content clicks from closing the modal
    document.querySelector('.modal-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // LAN evening modal functionality
    const lanLink = document.getElementById('lan-link');
    const lanModal = document.getElementById('lan-modal');
    const lanClose = lanModal.querySelector('.modal-close');

    // Function to open LAN modal
    function openLanModal() {
        lanModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Function to close LAN modal
    function closeLanModal() {
        lanModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Add click event listener to LAN link
    lanLink.addEventListener('click', function(e) {
        e.preventDefault();
        openLanModal();
    });

    // Close LAN modal when clicking the close button
    lanClose.addEventListener('click', closeLanModal);

    // Close LAN modal when clicking outside the modal content
    lanModal.addEventListener('click', function(e) {
        if (e.target === lanModal) {
            closeLanModal();
        }
    });

    // Close LAN modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && lanModal.classList.contains('active')) {
            closeLanModal();
        }
    });

    // Prevent LAN modal content clicks from closing the modal
    lanModal.querySelector('.modal-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // AI music link functionality
    const aiMusicLink = document.getElementById('ai-music-link');
    
    // Add click event listener to AI music link
    aiMusicLink.addEventListener('click', function(e) {
        e.preventDefault();
        // Open the AI music page in the same window
        window.location.href = 'https://ai-song-contest-dpawd9ccema6c6e6.northeurope-01.azurewebsites.net/';
    });

    // Simball link functionality
    const simballLink = document.getElementById('simball-link');
    
    // Add click event listener to Simball link
    simballLink.addEventListener('click', function(e) {
        e.preventDefault();
        // Open the Simball page in the same window
        window.location.href = 'https://black-coast-075c6ea03.4.azurestaticapps.net/';
    });
});