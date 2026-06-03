import { Component, OnInit, ViewChild, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ToolService } from '../../services/tool.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToolDialogComponent } from '../tool-dialog/tool-dialog.component';

@Injectable()
export class HungarianPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Termék / oldal:';
  override nextPageLabel = 'Következő oldal';
  override previousPageLabel = 'Előző oldal';
  override firstPageLabel = 'Első oldal';
  override lastPageLabel = 'Utolsó oldal';

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `0 a ${length}-ből`;
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} a ${length}-ből`;
  };
}

@Component({
  selector: 'app-tool-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatTableModule, 
    MatButtonModule, 
    MatDialogModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule
  ],
  providers: [
    { provide: MatPaginatorIntl, useClass: HungarianPaginatorIntl }
  ],
  templateUrl: './tool-list.component.html',
  styleUrls: ['./tool-list.component.scss']
})
export class ToolListComponent implements OnInit {
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  displayedColumns: string[] = ['image', 'name', 'brand', 'category', 'price', 'quantity', 'actions'];
  
  searchColumn: string = 'all';
  searchQuery: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private toolService: ToolService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (!this.authService.getToken()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Egyedi szűrő logika a kiválasztott oszlop alapján
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchObj = JSON.parse(filter);
      const query = searchObj.query;
      const column = searchObj.column;

      if (!query) return true;

      if (column === 'all') {
        const dataStr = Object.values(data).join(' ').toLowerCase();
        return dataStr.includes(query);
      } else {
        const value = data[column] ? data[column].toString().toLowerCase() : '';
        return value.includes(query);
      }
    };

    this.loadTools();
  }

  loadTools(): void {
    this.toolService.getTools().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (err) => {
        console.error('Hiba a szerszámok betöltésekor', err);
      }
    });
  }

  getTotalValue(): number {
    if (!this.dataSource || !this.dataSource.data) return 0;
    return this.dataSource.data.reduce((acc, tool) => acc + (tool.price * tool.quantity), 0);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilter();
  }

  applyFilter() {
    const filterValue = {
      query: this.searchQuery.trim().toLowerCase(),
      column: this.searchColumn
    };
    
    this.dataSource.filter = JSON.stringify(filterValue);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  exportToCSV(): void {
    // Csak a szűrt/megjelenített adatokat exportáljuk
    const dataToExport = this.dataSource.filteredData || this.dataSource.data;
    if (!dataToExport || dataToExport.length === 0) return;

    const headers = ['Megnevezés', 'Márka', 'Kategória', 'Ár (HUF)', 'Készlet (db)'];
    
    const csvRows = dataToExport.map(tool => {
      return [
        `"${tool.name}"`,
        `"${tool.brand}"`,
        `"${tool.category}"`,
        tool.price,
        tool.quantity
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // UTF-8 BOM a magyar ékezetek miatt
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'keszlet_export.csv';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  openDialog(tool?: any): void {
    const dialogRef = this.dialog.open(ToolDialogComponent, {
      width: '500px',
      data: { tool }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTools(); // Újratöltjük a listát, ha történt változás
      }
    });
  }

  deleteTool(id: string): void {
    if (confirm('Biztosan törölni szeretné ezt a terméket?')) {
      this.toolService.deleteTool(id).subscribe({
        next: () => this.loadTools(),
        error: (err) => console.error('Hiba a törlés során', err)
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
