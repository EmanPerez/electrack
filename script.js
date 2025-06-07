const rates = {
    generation: 5.5,
    transmission: 1.2,
    distribution: 1.5,
    systemLoss: 0.8,
    otherCharges: 0.5,
    vatRate: 0.12,
    franchiseTaxRate: 0.03,
  };

  function updateDarkModeIcon() {
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('darkIcon').style.display = isDark ? '' : 'none';
    document.getElementById('lightIcon').style.display = isDark ? 'none' : '';
  }

  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    updateDarkModeIcon();
  }

  function getEffectiveRate(includeFranchiseTax) {
    const baseRate = rates.generation + rates.transmission + rates.distribution + rates.systemLoss + rates.otherCharges;
    const vat = baseRate * rates.vatRate;
    const franchiseTax = includeFranchiseTax ? baseRate * rates.franchiseTaxRate : 0;
    return baseRate + vat + franchiseTax;
  }

  function calculateBill() {
    const kWhInput = document.getElementById('kWh');
    const kWh = parseFloat(kWhInput.value);
    const includeTax = document.getElementById('includeTax').checked;

    if (isNaN(kWh) || kWh <= 0) {
      kWhInput.focus();
      return alert('Please enter a valid number greater than 0 for kWh.');
    }

    const rate = getEffectiveRate(includeTax);
    const total = kWh * rate;

    document.getElementById('billResult').innerText = `Total Bill: ₱${total.toFixed(2)}\nRate per kWh: ₱${rate.toFixed(2)}`;
  }

  function toggleMultiplierInput() {
    const duration = document.getElementById('duration').value;
    const multiplierContainer = document.getElementById('multiplierContainer');
    multiplierContainer.classList.toggle('hidden', duration === 'hour');
  }

  function calculateApplianceCost() {
    const applianceName = document.getElementById('applianceName').value.trim();
    const wattageInput = document.getElementById('wattage');
    const hoursInput = document.getElementById('hours');

    const wattage = parseFloat(wattageInput.value);
    const hours = parseFloat(hoursInput.value);
    const duration = document.getElementById('duration').value;
    const includeTax = document.getElementById('applianceTax').checked;

    if (!applianceName) {
      alert('Please enter the appliance name.');
      return;
    }

    if (isNaN(wattage) || wattage <= 0) {
      wattageInput.focus();
      return alert('Please enter a valid wattage greater than 0.');
    }

    if (isNaN(hours) || hours <= 0) {
      hoursInput.focus();
      return alert('Please enter valid hours greater than 0.');
    }

    const kWhPerDay = (wattage * hours) / 1000;
    let totalUsage;
    let durationText;

    let multiplier = 1;
    if (duration !== 'hour') {
      const multiplierInput = document.getElementById('multiplier');
      multiplier = parseFloat(multiplierInput.value);
      if (isNaN(multiplier) || multiplier <= 0) {
        multiplierInput.focus();
        return alert('Please enter a valid number of days/weeks/months.');
      }
    }

    switch (duration) {
      case 'hour':
        totalUsage = (wattage * hours) / 1000;
        durationText = hours === 1 ? '1 hour' : `${hours} hours`;
        break;
      case 'day':
        totalUsage = kWhPerDay * multiplier;
        durationText = multiplier === 1 ? '1 day' : `${multiplier} days`;
        break;
      case 'week':
        totalUsage = kWhPerDay * 7 * multiplier;
        durationText = multiplier === 1 ? '1 week' : `${multiplier} weeks`;
        break;
      case 'month':
        totalUsage = kWhPerDay * 30 * multiplier;
        durationText = multiplier === 1 ? '1 month' : `${multiplier} months`;
        break;
      default:
        return alert('Invalid duration selected.');
    }

    const rate = getEffectiveRate(includeTax);
    const totalCost = totalUsage * rate;

    let dailyAverage = '';
    if (duration !== 'hour' && duration !== 'day') {
      const daysInPeriod = duration === 'week' ? 7 * multiplier : 30 * multiplier;
      dailyAverage = `\nDaily Average: ${(totalUsage / daysInPeriod).toFixed(2)} kWh (₱${((totalCost / daysInPeriod)).toFixed(2)})`;
    }

    const resultText = `Appliance: ${applianceName}
Duration: ${durationText}
Energy Used: ${totalUsage.toFixed(2)} kWh
Rate per kWh: ₱${rate.toFixed(2)}
Total Cost: ₱${totalCost.toFixed(2)}${dailyAverage}
${includeTax ? '(Includes 3% Franchise Tax)' : ''}`;

    document.getElementById('applianceResult').innerText = resultText;

    // Add result to the cost list
    addToCostList(resultText);
  }

  function addToCostList(resultText) {
    // Parse the resultText to extract values
    const applianceMatch = resultText.match(/Appliance:\s*(.*)/);
    const durationMatch = resultText.match(/Duration:\s*(.*)/);
    const energyMatch = resultText.match(/Energy Used:\s*([\d\.]+)/);
    const rateMatch = resultText.match(/Rate per kWh:\s*₱([\d\.]+)/);
    const totalMatch = resultText.match(/Total Cost:\s*₱([\d\.]+)/);
    const franchiseTax = /Includes 3% Franchise Tax/.test(resultText) ? 'Yes' : 'No';

    const appliance = applianceMatch ? applianceMatch[1] : '';
    const duration = durationMatch ? durationMatch[1] : '';
    const energy = energyMatch ? energyMatch[1] : '';
    const rate = rateMatch ? `₱${rateMatch[1]}` : '';
    const total = totalMatch ? `₱${totalMatch[1]}` : '';

    const table = document.getElementById('costListTable').querySelector('tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${appliance}</td>
      <td>${duration}</td>
      <td>${energy}</td>
      <td>${rate}</td>
      <td>${total}</td>
      <td>${franchiseTax}</td>
      <td><button class="remove-row-btn" title="Remove this entry">&times;</button></td>
    `;
    // Add event listener to the remove button
    tr.querySelector('.remove-row-btn').addEventListener('click', function() {
      tr.remove();
    });
    table.appendChild(tr);
  }

  async function exportCostListPDF() {
    try {
      const listSection = document.querySelector('.cost-list-section');
      if (!listSection) {
        alert('No list to export.');
        return;
      }
      const exportBtn = document.querySelector('.export-list-btn');
      if (exportBtn) {
        exportBtn.textContent = 'Generating PDF...';
        exportBtn.disabled = true;
      }
      const canvas = await html2canvas(listSection, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pageWidth - 20;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
      pdf.save('calculated-cost-list.pdf');
      if (exportBtn) {
        exportBtn.textContent = 'Export List as PDF';
        exportBtn.disabled = false;
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
      const exportBtn = document.querySelector('.export-list-btn');
      if (exportBtn) {
        exportBtn.textContent = 'Export List as PDF';
        exportBtn.disabled = false;
      }
    }
  }

  function resetFields() {
    document.getElementById('applianceName').value = '';
    document.getElementById('wattage').value = '';
    document.getElementById('hours').value = '';
    document.getElementById('duration').value = 'hour';
    document.getElementById('multiplier').value = '';
    document.getElementById('applianceTax').checked = false;
    document.getElementById('multiplierContainer').classList.add('hidden');
    document.getElementById('applianceResult').innerText = '';
  }

  function clearCostTable() {
    const table = document.getElementById('costListTable').querySelector('tbody');
    table.innerHTML = '';
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateDarkModeIcon();
    document.querySelectorAll('.dark-mode-btn, .logout-btn').forEach(btn => {
      btn.addEventListener('mouseup', function() {
        this.blur();
      });
    });
  });