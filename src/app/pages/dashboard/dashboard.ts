import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartDataset, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, NgChartsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  nomUtilisateur: string = '';
  donneesChargees = false;

  totalProfils = 0;
  nbRecommandes = 0;
  moyenneScore = 0;
  nouveauxProfils: any[] = [];

  topMetiersLabels: string[] = [];
  topMetiersData: ChartDataset<'bar'>[] = [];

  villesLabels: string[] = [];
  villesData: ChartDataset<'bar'>[] = [];

  etudesLabels: string[] = [];
  etudesData: ChartDataset<'bar'>[] = [];

  // 🔹 Graphe 1 : top compétences
  skillsData: ChartData<'bar'> = { datasets: [], labels: [] };
  skillsOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' }
    }
  };

  // 🔹 Graphe 2 : compétences par métier (horizontal)
  skillsPerJobData: ChartData<'bar'> = { datasets: [], labels: [] };
  skillsPerJobOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: { position: 'top' }
    }
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const nom = localStorage.getItem('user_nom');
    if (nom) this.nomUtilisateur = nom;

    const token = localStorage.getItem('token');
    if (token) {
      this.http.get<any>('http://localhost:5000/api/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).subscribe({
        next: (res) => {
          console.log("📥 Données reçues du backend :", res);
          this.injecterDonnees(res);
        },
        error: (err) => console.error('Erreur dashboard', err)
      });
    }
  }

  injecterDonnees(data: any) {
    this.totalProfils = data.totalProfils;
    this.nbRecommandes = data.nbRecommandes;
    this.moyenneScore = Math.round(data.moyenneScore * 100);
    this.nouveauxProfils = data.nouveauxProfils;

    // 🧩 Top métiers
    this.topMetiersLabels = data.topMetiers.map((m: any) => m.jobtitle);
    this.topMetiersData = [
      { data: data.topMetiers.map((m: any) => m.total), label: 'Métiers' }
    ];

    // 🧩 Villes
    this.villesLabels = data.repartitionVilles.map((v: any) => v.location);
    this.villesData = [
      { data: data.repartitionVilles.map((v: any) => v.total), label: 'Villes' }
    ];

    // 🧩 Études
    this.etudesLabels = data.niveauEtude.map((e: any) => e.schooldegree);
    this.etudesData = [
      { data: data.niveauEtude.map((e: any) => e.total), label: 'Diplômes' }
    ];

    // 🧩 Graphe 1 – Top 10 compétences
    this.skillsData = {
      labels: data.topSkills.map((s: any) => s.skill),
      datasets: [{
        data: data.topSkills.map((s: any) => s.count),
        label: 'Compétences',
        backgroundColor: this.generateColors(data.topSkills.length)
      }]
    };

    // 🧩 Graphe 2 – Répartition compétences par métier
    const skillsLabels = data.skillsPerJob.flatMap((j: any) =>
      j.skills.map((s: any) => `${j.job} → ${s.skill}`)
    );
    const skillsCounts = data.skillsPerJob.flatMap((j: any) =>
      j.skills.map((s: any) => s.count)
    );

    this.skillsPerJobData = {
      labels: skillsLabels,
      datasets: [{
        data: skillsCounts,
        label: 'Compétences/Métier',
        backgroundColor: this.generateColors(skillsLabels.length)
      }]
    };

    this.donneesChargees = true;
  }

  generateColors(n: number): string[] {
    return Array.from({ length: n }, () =>
      '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    );
  }

  deconnexion() {
    localStorage.clear();
    window.location.href = '/login';
  }
}
