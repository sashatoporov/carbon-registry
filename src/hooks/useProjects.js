import { useState, useEffect } from 'react';

export function useProjects() {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        if (window.PROJECTS) {
            setProjects(window.PROJECTS);
        } else {
            const interval = setInterval(() => {
                if (window.PROJECTS) {
                    setProjects(window.PROJECTS);
                    clearInterval(interval);
                }
            }, 50);
            return () => clearInterval(interval);
        }
    }, []);

    return projects;
}
